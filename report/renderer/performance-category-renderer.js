/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/** @typedef {import('./dom.js').DOM} DOM */

import {CategoryRenderer} from './category-renderer.js';
import {ReportUtils} from './report-utils.js';
import {Globals} from './report-globals.js';
import {Util} from '../../shared/util.js';

export class PerformanceCategoryRenderer extends CategoryRenderer {
  /**
   * @param {LH.ReportResult.AuditRef} audit
   * @return {!Element}
   */
  _renderMetric(audit) {
    const tmpl = this.dom.createComponent('metric');
    const element = this.dom.find('.lh-metric', tmpl);
    element.id = audit.result.id;
    const rating = ReportUtils.calculateRating(audit.result.score, audit.result.scoreDisplayMode);
    element.classList.add(`lh-metric--${rating}`);

    const titleEl = this.dom.find('.lh-metric__title', tmpl);
    titleEl.textContent = audit.result.title;

    const valueEl = this.dom.find('.lh-metric__value', tmpl);
    valueEl.textContent = audit.result.displayValue || '';

    const descriptionEl = this.dom.find('.lh-metric__description', tmpl);
    descriptionEl.append(this.dom.convertMarkdownLinkSnippets(audit.result.description));

    if (audit.result.scoreDisplayMode === 'error') {
      descriptionEl.textContent = '';
      valueEl.textContent = 'Error!';
      const tooltip = this.dom.createChildOf(descriptionEl, 'span');
      tooltip.textContent = audit.result.errorMessage || 'Report error: no metric information';
    } else if (audit.result.scoreDisplayMode === 'notApplicable') {
      valueEl.textContent = '--';
    }

    return element;
  }

  /**
   * Get a link to the interactive scoring calculator with the metric values.
   * @param {LH.ReportResult.AuditRef[]} auditRefs
   * @return {string}
   */
  _getScoringCalculatorHref(auditRefs) {
    // TODO: filter by !!acronym when dropping renderer support of v7 LHRs.
    const metrics = auditRefs.filter(audit => audit.group === 'metrics');
    const tti = auditRefs.find(audit => audit.id === 'interactive');
    const fci = auditRefs.find(audit => audit.id === 'first-cpu-idle');
    const fmp = auditRefs.find(audit => audit.id === 'first-meaningful-paint');
    if (tti) metrics.push(tti);
    if (fci) metrics.push(fci);
    if (fmp) metrics.push(fmp);

    /**
     * Clamp figure to 2 decimal places
     * @param {number} val
     * @return {number}
     */
    const clampTo2Decimals = val => Math.round(val * 100) / 100;

    const metricPairs = metrics.map(audit => {
      let value;
      if (typeof audit.result.numericValue === 'number') {
        value = audit.id === 'cumulative-layout-shift' ?
          clampTo2Decimals(audit.result.numericValue) :
          Math.round(audit.result.numericValue);
        value = value.toString();
      } else {
        value = 'null';
      }
      return [audit.acronym || audit.id, value];
    });
    const paramPairs = [...metricPairs];

    if (Globals.reportJson) {
      paramPairs.push(['device', Globals.reportJson.configSettings.formFactor]);
      paramPairs.push(['version', Globals.reportJson.lighthouseVersion]);
    }

    const params = new URLSearchParams(paramPairs);
    const url = new URL('https://googlechrome.github.io/lighthouse/scorecalc/');
    url.hash = params.toString();
    return url.href;
  }

  /**
   * Returns true if the audit is a general performance insight (i.e. not a metric or hidden audit).
   *
   * @param {LH.ReportResult.AuditRef} audit
   * @return {boolean}
   */
  _isPerformanceInsight(audit) {
    return !audit.group;
  }

  /**
   * @param {LH.ReportResult.AuditRef} audit
   * @param {LH.ReportResult.AuditRef[]} metricAudits
   * @return {{overallImpact: number, overallLinearImpact: number}}
   */
  overallImpact(audit, metricAudits) {
    if (!audit.result.metricSavings) {
      return {overallImpact: 0, overallLinearImpact: 0};
    }

    let overallImpact = 0;
    let overallLinearImpact = 0;
    for (const [k, savings] of Object.entries(audit.result.metricSavings)) {
      // Get metric savings for individual audit.
      if (savings === undefined) continue;

      // Get the metric data.
      const mAudit = metricAudits.find(audit => audit.acronym === k);
      if (!mAudit) continue;
      if (mAudit.result.score === null) continue;

      const mValue = mAudit.result.numericValue;
      if (!mValue) continue;

      const scoringOptions = mAudit.result.scoringOptions;
      if (!scoringOptions) continue;

      const newMetricScore = Util.computeLogNormalScore(scoringOptions, mValue - savings);
      const linearImpact = savings / mValue * mAudit.weight;
      overallLinearImpact += linearImpact;

      const weightedMetricImpact = (newMetricScore - mAudit.result.score) * mAudit.weight;
      overallImpact += weightedMetricImpact;
    }
    return {overallImpact, overallLinearImpact};
  }

  /**
   * @param {LH.ReportResult.Category} category
   * @param {Object<string, LH.Result.ReportGroup>} groups
   * @param {{gatherMode: LH.Result.GatherMode}=} options
   * @return {Element}
   * @override
   */
  render(category, groups, options) {
    const strings = Globals.strings;
    const element = this.dom.createElement('div', 'lh-category');
    element.id = category.id;
    element.append(this.renderCategoryHeader(category, groups, options));

    // Metrics.
    const metricAudits = category.auditRefs.filter(audit => audit.group === 'metrics');
    if (metricAudits.length) {
      const [metricsGroupEl, metricsFooterEl] = this.renderAuditGroup(groups.metrics);

      // Metric descriptions toggle.
      const checkboxEl = this.dom.createElement('input', 'lh-metrics-toggle__input');
      const checkboxId = `lh-metrics-toggle${Globals.getUniqueSuffix()}`;
      checkboxEl.setAttribute('aria-label', 'Toggle the display of metric descriptions');
      checkboxEl.type = 'checkbox';
      checkboxEl.id = checkboxId;
      metricsGroupEl.prepend(checkboxEl);
      const metricHeaderEl = this.dom.find('.lh-audit-group__header', metricsGroupEl);
      const labelEl = this.dom.createChildOf(metricHeaderEl, 'label', 'lh-metrics-toggle__label');
      labelEl.htmlFor = checkboxId;
      const showEl = this.dom.createChildOf(labelEl, 'span', 'lh-metrics-toggle__labeltext--show');
      const hideEl = this.dom.createChildOf(labelEl, 'span', 'lh-metrics-toggle__labeltext--hide');
      showEl.textContent = Globals.strings.expandView;
      hideEl.textContent = Globals.strings.collapseView;

      const metricsBoxesEl = this.dom.createElement('div', 'lh-metrics-container');
      metricsGroupEl.insertBefore(metricsBoxesEl, metricsFooterEl);
      metricAudits.forEach(item => {
        metricsBoxesEl.append(this._renderMetric(item));
      });

      // Only add the disclaimer with the score calculator link if the category was rendered with a score gauge.
      if (element.querySelector('.lh-gauge__wrapper')) {
        const descriptionEl = this.dom.find('.lh-category-header__description', element);
        const estValuesEl = this.dom.createChildOf(descriptionEl, 'div', 'lh-metrics__disclaimer');
        const disclaimerEl = this.dom.convertMarkdownLinkSnippets(strings.varianceDisclaimer);
        estValuesEl.append(disclaimerEl);

        // Add link to score calculator.
        const calculatorLink = this.dom.createChildOf(estValuesEl, 'a', 'lh-calclink');
        calculatorLink.target = '_blank';
        calculatorLink.textContent = strings.calculatorLink;
        this.dom.safelySetHref(calculatorLink, this._getScoringCalculatorHref(category.auditRefs));
      }

      metricsGroupEl.classList.add('lh-audit-group--metrics');
      element.append(metricsGroupEl);
    }

    // Filmstrip
    const timelineEl = this.dom.createChildOf(element, 'div', 'lh-filmstrip-container');
    const thumbnailAudit = category.auditRefs.find(audit => audit.id === 'screenshot-thumbnails');
    const thumbnailResult = thumbnailAudit?.result;
    if (thumbnailResult?.details) {
      timelineEl.id = thumbnailResult.id;
      const filmstripEl = this.detailsRenderer.render(thumbnailResult.details);
      filmstripEl && timelineEl.append(filmstripEl);
    }

    const filterableMetrics = metricAudits.filter(a => !!a.relevantAudits);
    // TODO: only add if there are opportunities & diagnostics rendered.
    if (filterableMetrics.length) {
      this.renderMetricAuditFilter(filterableMetrics, element);
    }

    // Diagnostics
    const diagnosticAudits = category.auditRefs
        .filter(audit => this._isPerformanceInsight(audit))
        .filter(audit => !ReportUtils.showAsPassed(audit.result))
        .sort((a, b) => {
          // Sort by impact.
          const {
            overallImpact: aOverallImpact,
            overallLinearImpact: aOverallLinearImpact,
          } = this.overallImpact(a, metricAudits);
          const {
            overallImpact: bOverallImpact,
            overallLinearImpact: bOverallLinearImpact,
          } = this.overallImpact(b, metricAudits);

          const aGuidanceLevel = a.result.guidanceLevel || 1;
          const bGuidanceLevel = b.result.guidanceLevel || 1;

          if (aOverallImpact !== bOverallImpact) return bOverallImpact - aOverallImpact;

          if (
            aOverallImpact === 0 && bOverallImpact === 0 &&
            aOverallLinearImpact !== bOverallLinearImpact
          ) {
            return bOverallLinearImpact - aOverallLinearImpact;
          }

          if (aGuidanceLevel !== bGuidanceLevel) return bGuidanceLevel - aGuidanceLevel;

          const scoreA = a.result.scoreDisplayMode === 'informative' ? 100 : Number(a.result.score);
          const scoreB = b.result.scoreDisplayMode === 'informative' ? 100 : Number(b.result.score);
          return scoreA - scoreB;
        });

    if (diagnosticAudits.length) {
      const [groupEl, footerEl] = this.renderAuditGroup(groups['diagnostics']);
      diagnosticAudits.forEach(item => groupEl.insertBefore(this.renderAudit(item), footerEl));
      groupEl.classList.add('lh-audit-group--diagnostics');
      element.append(groupEl);
    }

    // Passed audits
    const passedAudits = category.auditRefs
        .filter(audit =>
          this._isPerformanceInsight(audit) && ReportUtils.showAsPassed(audit.result));

    if (!passedAudits.length) return element;

    const clumpOpts = {
      auditRefs: passedAudits,
      groupDefinitions: groups,
    };
    const passedElem = this.renderClump('passed', clumpOpts);
    element.append(passedElem);

    // Budgets
    /** @type {Array<Element>} */
    const budgetTableEls = [];
    ['performance-budget', 'timing-budget'].forEach((id) => {
      const audit = category.auditRefs.find(audit => audit.id === id);
      if (audit?.result.details) {
        const table = this.detailsRenderer.render(audit.result.details);
        if (table) {
          table.id = id;
          table.classList.add('lh-details', 'lh-details--budget', 'lh-audit');
          budgetTableEls.push(table);
        }
      }
    });
    if (budgetTableEls.length > 0) {
      const [groupEl, footerEl] = this.renderAuditGroup(groups.budgets);
      budgetTableEls.forEach(table => groupEl.insertBefore(table, footerEl));
      groupEl.classList.add('lh-audit-group--budgets');
      element.append(groupEl);
    }

    return element;
  }

  /**
   * Render the control to filter the audits by metric. The filtering is done at runtime by CSS only
   * @param {LH.ReportResult.AuditRef[]} filterableMetrics
   * @param {HTMLDivElement} categoryEl
   */
  renderMetricAuditFilter(filterableMetrics, categoryEl) {
    const metricFilterEl = this.dom.createElement('div', 'lh-metricfilter');
    const textEl = this.dom.createChildOf(metricFilterEl, 'span', 'lh-metricfilter__text');
    textEl.textContent = Globals.strings.showRelevantAudits;

    const filterChoices = /** @type {LH.ReportResult.AuditRef[]} */ ([
      ({acronym: 'All'}),
      ...filterableMetrics,
    ]);

    // Form labels need to reference unique IDs, but multiple reports rendered in the same DOM (eg PSI)
    // would mean ID conflict.  To address this, we 'scope' these radio inputs with a unique suffix.
    const uniqSuffix = Globals.getUniqueSuffix();
    for (const metric of filterChoices) {
      const elemId = `metric-${metric.acronym}-${uniqSuffix}`;
      const radioEl = this.dom.createChildOf(metricFilterEl, 'input', 'lh-metricfilter__radio');
      radioEl.type = 'radio';
      radioEl.name = `metricsfilter-${uniqSuffix}`;
      radioEl.id = elemId;

      const labelEl = this.dom.createChildOf(metricFilterEl, 'label', 'lh-metricfilter__label');
      labelEl.htmlFor = elemId;
      labelEl.title = metric.result?.title;
      labelEl.textContent = metric.acronym || metric.id;

      if (metric.acronym === 'All') {
        radioEl.checked = true;
        labelEl.classList.add('lh-metricfilter__label--active');
      }
      categoryEl.append(metricFilterEl);

      // Toggle class/hidden state based on filter choice.
      radioEl.addEventListener('input', _ => {
        for (const elem of categoryEl.querySelectorAll('label.lh-metricfilter__label')) {
          elem.classList.toggle('lh-metricfilter__label--active', elem.htmlFor === elemId);
        }
        categoryEl.classList.toggle('lh-category--filtered', metric.acronym !== 'All');

        for (const perfAuditEl of categoryEl.querySelectorAll('div.lh-audit')) {
          if (metric.acronym === 'All') {
            perfAuditEl.hidden = false;
            continue;
          }

          perfAuditEl.hidden = true;
          if (metric.relevantAudits && metric.relevantAudits.includes(perfAuditEl.id)) {
            perfAuditEl.hidden = false;
          }
        }

        // Hide groups/clumps if all child audits are also hidden.
        const groupEls = categoryEl.querySelectorAll('div.lh-audit-group, details.lh-audit-group');
        for (const groupEl of groupEls) {
          groupEl.hidden = false;
          const childEls = Array.from(groupEl.querySelectorAll('div.lh-audit'));
          const areAllHidden = !!childEls.length && childEls.every(auditEl => auditEl.hidden);
          groupEl.hidden = areAllHidden;
        }
      });
    }
  }
}
