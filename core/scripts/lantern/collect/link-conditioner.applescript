-- Note: this works on my personal mac (Intel, still on Montery), but not on my work mac (M1, on Ventura).
-- For Ventura: change "System Preferences" to "System Settings". And figure out why `click button "ON"` fails.

on run argv
  set {should_enable, mode} to {item 1, item 2} of argv

  tell application "System Preferences"
    activate
    delay 0.1
    set current pane to pane id "com.apple.Network-Link-Conditioner"
  end tell

  set FinalString to ""
  set CurrString to ""

  tell application "System Events"
  tell application process "System Preferences"

    set num_windows to count windows
    repeat until (num_windows > 0)
      set num_windows to count windows
      set CurrString to "num_windows: " & num_windows
      set FinalString to FinalString & CurrString & "\n"
      delay 0.1
    end repeat

    tell window "Network Link Conditioner"
      -- Buttons have no names on Ventura...?
      -- repeat with b in (get buttons)
      --   set CurrString to "btn: " & (name of b)
      --   set FinalString to FinalString & CurrString & "\n"
      -- end repeat

      -- Note: the "Accessibility Inspector" app is great for identifiying UI element names, but
      -- in this case it is obvious.
      if (should_enable = "true")
        tell group 1
          click pop up button 1
          click menu item mode of menu 1 of pop up button 1
        end tell
        click button "ON"
      else
        click button "OFF"
      end if

    end tell
    
  end tell
  end tell

  -- Uncomment for debugging.
  -- copy FinalString to stdout
end run

