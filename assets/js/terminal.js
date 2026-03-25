/**
 * SCS Platform - Terminal (Premium Version)
 * Command history, hack simulation, progress bars, glitch effects
 */

(function() {
  'use strict';

  var termInput = document.getElementById('term-input');
  var termOutput = document.getElementById('term-output');

  if (!termInput || !termOutput) return;

  // Focus input when clicking anywhere in terminal
  var termWindow = document.querySelector('.terminal-window');
  if (termWindow) {
    termWindow.addEventListener('click', function() {
      termInput.focus();
    });
  }

  // Command history
  var commandHistory = [];
  var historyIndex = -1;

  // Team data
  var TEAM = [
    { alias: 'AXIOM_0', initials: 'AX', role: 'Lead Security Researcher', cves: 12, ctfRank: 3 },
    { alias: 'PHANTOM_7', initials: 'PH', role: 'Malware Analyst', cves: 8, ctfRank: 7 },
    { alias: 'NOCTURN_G', initials: 'NG', role: 'Exploit Developer', cves: 21, ctfRank: 1 },
    { alias: 'ZEROW3', initials: 'Z3', role: 'AI Security Specialist', cves: 5, ctfRank: 11 },
    { alias: 'CR4WL3R', initials: 'CR', role: 'Network Pentester', cves: 9, ctfRank: 5 },
    { alias: 'SH4D0WFOX', initials: 'SH', role: 'Red Team Operator', cves: 17, ctfRank: 2 }
  ];

  // Projects data
  var PROJECTS = [
    { name: 'DARKSCANNER', status: 'ACTIVE', desc: 'AI-assisted vulnerability scanner' },
    { name: 'SPECTRE-CTF', status: 'ACTIVE', desc: 'Custom CTF platform' },
    { name: 'NEXUS OSINT', status: 'BETA', desc: 'OSINT aggregation framework' },
    { name: 'MALWARE LAB', status: 'ACTIVE', desc: 'Sandboxed malware analysis' }
  ];

  // Glitch effect
  function triggerGlitch() {
    document.body.style.animation = 'glitch 0.15s ease-in-out';
    setTimeout(function() {
      document.body.style.animation = '';
    }, 150);
  }

  // Progress bar animation
  function showProgressBar(callback) {
    var progressDiv = document.createElement('div');
    progressDiv.className = 'terminal-output';
    progressDiv.innerHTML = '<div class="terminal-progress"><div class="terminal-progress-bar"></div></div>';
    termOutput.appendChild(progressDiv);
    termOutput.scrollTop = termOutput.scrollHeight;

    var progressBar = progressDiv.querySelector('.terminal-progress-bar');
    var width = 0;

    function animate() {
      width += Math.random() * 20 + 5;
      if (width >= 100) {
        width = 100;
        progressBar.style.width = width + '%';
        setTimeout(callback, 200);
      } else {
        progressBar.style.width = width + '%';
        setTimeout(animate, 100 + Math.random() * 150);
      }
    }

    animate();
  }

  // Typing effect for output
  function typeOutput(element, callback) {
    var lines = element.querySelectorAll('.terminal-result, .terminal-line');
    var delay = 25;
    
    lines.forEach(function(line, index) {
      line.style.opacity = '0';
      line.style.transform = 'translateY(5px)';
      
      setTimeout(function() {
        line.style.transition = 'opacity 0.15s, transform 0.15s';
        line.style.opacity = '1';
        line.style.transform = 'translateY(0)';
      }, index * delay);
    });
    
    setTimeout(callback || function() {}, lines.length * delay + 100);
  }

  // Add output with typing effect
  function addOutput(html, callback) {
    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    var outputDiv = tempDiv.firstElementChild;
    
    termOutput.appendChild(outputDiv);
    termOutput.scrollTop = termOutput.scrollHeight;
    
    typeOutput(outputDiv, callback || function() {});
  }

  // Command definitions
  var commands = {
    help: function() {
      addOutput(
        '<div class="terminal-output">' +
        '<div class="terminal-line"><span class="terminal-prompt">scs@terminal:~$</span> <span class="terminal-cmd">help</span></div>' +
        '<div class="terminal-result" style="color: var(--ice);">━━━ Available Commands ━━━</div>' +
        '<div class="terminal-result">  <span class="highlight">ls</span>            - List directory contents</div>' +
        '<div class="terminal-result">  <span class="highlight">cat [file]</span>    - Display file contents</div>' +
        '<div class="terminal-result">  <span class="highlight">whoami</span>       - Display current user</div>' +
        '<div class="terminal-result">  <span class="highlight">nmap [target]</span>  - Scan network targets</div>' +
        '<div class="terminal-result">  <span class="highlight">status</span>       - System status</div>' +
        '<div class="terminal-result">  <span class="highlight">team</span>         - List team members</div>' +
        '<div class="terminal-result">  <span class="highlight">projects</span>      - List projects</div>' +
        '<div class="terminal-result">  <span class="highlight">hack</span>         - Simulate hacking attack</div>' +
        '<div class="terminal-result">  <span class="highlight">clear</span>        - Clear terminal</div>' +
        '<div class="terminal-result">  <span class="highlight">neofetch</span>     - System info</div>' +
        '<div class="terminal-result">  <span class="highlight">history</span>       - Command history</div>' +
        '<div class="terminal-result">  <span class="highlight">sudo su</span>       - Attempt privilege escalation</div>' +
        '</div>'
      );
    },

    ls: function() {
      addOutput(
        '<div class="terminal-output">' +
        '<div class="terminal-line"><span class="terminal-prompt">scs@terminal:~$</span> <span class="terminal-cmd">ls</span></div>' +
        '<div class="terminal-result"><span style="color: var(--ice);">about.txt</span>  <span style="color: var(--amber);">docs/</span>  <span style="color: var(--amber);">projects/</span>  <span style="color: var(--amber);">team/</span>  <span style="color: var(--amber);">tools/</span></div>' +
        '</div>'
      );
    },

    'cat about.txt': function() {
      addOutput(
        '<div class="terminal-output">' +
        '<div class="terminal-line"><span class="terminal-prompt">scs@terminal:~$</span> <span class="terminal-cmd">cat about.txt</span></div>' +
        '<div class="terminal-result" style="color: var(--acid);">╔═══════════════════════════════════════╗</div>' +
        '<div class="terminal-result" style="color: var(--acid);">║   Society of Cyber Security (SCS)    ║</div>' +
        '<div class="terminal-result" style="color: var(--acid);">╚═══════════════════════════════════════╝</div>' +
        '<div class="terminal-result">Founded: 2024</div>' +
        '<div class="terminal-result">Mission: Advancing cybersecurity through research, education, and community</div>' +
        '<div class="terminal-result">Focus: Web Security, Network Pentesting, Malware Analysis, CTF</div>' +
        '<div class="terminal-result" style="color: var(--acid);">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>' +
        '<div class="terminal-result success">72 vulnerabilities discovered | 14 CVEs assigned</div>' +
        '</div>'
      );
    },

    whoami: function() {
      addOutput(
        '<div class="terminal-output">' +
        '<div class="terminal-line"><span class="terminal-prompt">scs@terminal:~$</span> <span class="terminal-cmd">whoami</span></div>' +
        '<div class="terminal-result">guest_user</div>' +
        '<div class="terminal-result info">Session: Anonymous | Level: Guest</div>' +
        '<div class="terminal-result info">Type "join" to request membership access</div>' +
        '</div>'
      );
    },

    nmap: function() {
      showProgressBar(function() {
        addOutput(
          '<div class="terminal-output">' +
          '<div class="terminal-line"><span class="terminal-prompt">scs@terminal:~$</span> <span class="terminal-cmd">nmap -sV -A scs-platform.local</span></div>' +
          '<div class="terminal-result" style="color: var(--amber);">Starting Nmap scan...</div>' +
          '<div class="terminal-result" style="color: var(--acid);">PORT     STATE  SERVICE      VERSION</div>' +
          '<div class="terminal-result">22/tcp   open   ssh         OpenSSH 8.9p1</div>' +
          '<div class="terminal-result">80/tcp   open   http        nginx 1.24.0</div>' +
          '<div class="terminal-result">443/tcp  open   ssl/http    nginx 1.24.0</div>' +
          '<div class="terminal-result">3000/tcp open   http        Node.js</div>' +
          '<div class="terminal-result">OS: Linux 5.15 (Ubuntu)</div>' +
          '<div class="terminal-result success">Nmap done: 1 IP scanned</div>' +
          '</div>'
        );
      });
    },

    status: function() {
      addOutput(
        '<div class="terminal-output">' +
        '<div class="terminal-line"><span class="terminal-prompt">scs@terminal:~$</span> <span class="terminal-cmd">status</span></div>' +
        '<div class="terminal-result" style="color: var(--acid);">━━━ SYSTEM STATUS ━━━</div>' +
        '<div class="terminal-result"><span style="color: var(--acid);">●</span> Platform: ONLINE</div>' +
        '<div class="terminal-result"><span style="color: var(--acid);">●</span> Members: 47 active</div>' +
        '<div class="terminal-result"><span style="color: var(--acid);">●</span> Projects: 4 running</div>' +
        '<div class="terminal-result"><span style="color: var(--acid);">●</span> Events: 2 upcoming</div>' +
        '<div class="terminal-result"><span style="color: var(--acid);">●</span> CVE Database: Updated</div>' +
        '<div class="terminal-result success">All systems operational ✓</div>' +
        '</div>'
      );
    },

    team: function() {
      var output = 
        '<div class="terminal-output">' +
        '<div class="terminal-line"><span class="terminal-prompt">scs@terminal:~$</span> <span class="terminal-cmd">team</span></div>' +
        '<div class="terminal-result" style="color: var(--ice);">━━━ TEAM MEMBERS ━━━</div>';

      TEAM.forEach(function(member) {
        output += '<div class="terminal-result">' + member.alias + ' | ' + member.role + ' | CVEs: ' + member.cves + ' | Rank: #' + member.ctfRank + '</div>';
      });

      output += '</div>';
      addOutput(output);
    },

    projects: function() {
      var output = 
        '<div class="terminal-output">' +
        '<div class="terminal-line"><span class="terminal-prompt">scs@terminal:~$</span> <span class="terminal-cmd">projects</span></div>' +
        '<div class="terminal-result" style="color: var(--ice);">━━━ ACTIVE PROJECTS ━━━</div>';

      PROJECTS.forEach(function(proj) {
        var statusColor = proj.status === 'ACTIVE' ? 'var(--acid)' : 'var(--amber)';
        output += '<div class="terminal-result"><span style="color: ' + statusColor + ';">[' + proj.status + ']</span> ' + proj.name + ' - ' + proj.desc + '</div>';
      });

      output += '</div>';
      addOutput(output);
    },

    // NEW HACK COMMAND
    hack: function() {
      var steps = [
        { text: 'Scanning target...', delay: 400 },
        { text: 'Bypassing firewall...', delay: 600 },
        { text: 'Injecting payload...', delay: 500 },
        { text: 'Escalating privileges...', delay: 700 },
        { text: 'Access Granted.', delay: 300 }
      ];

      var stepIndex = 0;

      function showNextStep() {
        if (stepIndex < steps.length) {
          var step = steps[stepIndex];
          var isLast = stepIndex === steps.length - 1;
          
          addOutput(
            '<div class="terminal-output">' +
            '<div class="terminal-result"' + (isLast ? ' style="color: var(--acid); font-weight: bold; text-shadow: 0 0 10px var(--acid);"' : '') + '>' + step.text + '</div>' +
            '</div>'
          );

          if (isLast) {
            triggerGlitch();
          }

          stepIndex++;
          setTimeout(showNextStep, step.delay);
        }
      }

      showNextStep();
    },

    neofetch: function() {
      addOutput(
        '<div class="terminal-output">' +
        '<div class="terminal-line"><span class="terminal-prompt">scs@terminal:~$</span> <span class="terminal-cmd">neofetch</span></div>' +
        '<div class="terminal-result" style="color: var(--acid);">        ████████████████</div>' +
        '<div class="terminal-result" style="color: var(--acid);">      ██              ██</div>' +
        '<div class="terminal-result" style="color: var(--acid);">    ██     SCS      ██</div>' +
        '<div class="terminal-result" style="color: var(--acid);">    ██   Platform   ██</div>' +
        '<div class="terminal-result" style="color: var(--acid);">    ██              ██</div>' +
        '<div class="terminal-result" style="color: var(--acid);">      ████████████████</div>' +
        '<div class="terminal-result"></div>' +
        '<div class="terminal-result"><span style="color: var(--ice);">OS:</span> SCS Platform (Cyber Security)</div>' +
        '<div class="terminal-result"><span style="color: var(--ice);">Host:</span> Security Research Server</div>' +
        '<div class="terminal-result"><span style="color: var(--ice);">Kernel:</span> 5.15.0-scs-custom</div>' +
        '<div class="terminal-result"><span style="color: var(--ice);">Uptime:</span> 99.9% uptime</div>' +
        '<div class="terminal-result"><span style="color: var(--ice);">Shell:</span> zsh 5.9</div>' +
        '<div class="terminal-result"><span style="color: var(--ice);">Terminal:</span> xterm-256color</div>' +
        '<div class="terminal-result"><span style="color: var(--ice);">Theme:</span> Cyberpunk Dark</div>' +
        '<div class="terminal-result"><span style="color: var(--ice);">Members:</span> 47</div>' +
        '<div class="terminal-result"><span style="color: var(--ice);">CVEs:</span> 72 discovered</div>' +
        '</div>'
      );
    },

    history: function() {
      var output = 
        '<div class="terminal-output">' +
        '<div class="terminal-line"><span class="terminal-prompt">scs@terminal:~$</span> <span class="terminal-cmd">history</span></div>' +
        '<div class="terminal-result" style="color: var(--amber);">━━━ Command History ━━━</div>';

      commandHistory.forEach(function(cmd, index) {
        output += '<div class="terminal-result">    ' + (index + 1) + '  ' + cmd + '</div>';
      });

      if (commandHistory.length === 0) {
        output += '<div class="terminal-result">No commands in history</div>';
      }

      output += '</div>';
      addOutput(output);
    },

    clear: function() {
      termOutput.innerHTML = '';
    },

    'sudo su': function() {
      addOutput(
        '<div class="terminal-output">' +
        '<div class="terminal-line"><span class="terminal-prompt">scs@terminal:~$</span> <span class="terminal-cmd">sudo su</span></div>' +
        '<div class="terminal-result warning">[sudo] password for guest_user: </div>' +
        '<div class="terminal-result error">Sorry, user guest_user is not in the sudoers file.</div>' +
        '<div class="terminal-result error">This incident will be reported.</div>' +
        '</div>'
      );
    }
  };

  // Handle command input
  termInput.addEventListener('keydown', function(e) {
    // Command history navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        termInput.value = commandHistory[commandHistory.length - 1 - historyIndex];
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        termInput.value = commandHistory[commandHistory.length - 1 - historyIndex];
      } else if (historyIndex === 0) {
        historyIndex = -1;
        termInput.value = '';
      }
      return;
    }

    if (e.key === 'Enter') {
      var cmd = termInput.value.trim().toLowerCase();
      
      if (cmd) {
        // Add to history
        commandHistory.push(termInput.value.trim());
        if (commandHistory.length > 50) {
          commandHistory.shift();
        }
        historyIndex = -1;

        // Add command to output
        var cmdDiv = document.createElement('div');
        cmdDiv.className = 'terminal-output';
        cmdDiv.innerHTML = '<div class="terminal-line"><span class="terminal-prompt">scs@terminal:~$</span> ' + termInput.value + '</div>';
        termOutput.appendChild(cmdDiv);
        
        // Execute command
        if (commands[cmd]) {
          commands[cmd]();
        } else if (cmd.startsWith('cat ')) {
          commands['cat about.txt']();
        } else {
          addOutput(
            '<div class="terminal-output">' +
            '<div class="terminal-result error">Command not found: ' + cmd + '</div>' +
            '<div class="terminal-result">Type "help" for available commands</div>' +
            '</div>'
          );
        }
        
        termInput.value = '';
        termOutput.scrollTop = termOutput.scrollHeight;
      }
    }
  });

  // Command buttons
  var cmdButtons = document.querySelectorAll('.term-cmd');
  if (cmdButtons) {
    cmdButtons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var cmd = this.getAttribute('data-cmd');
        if (cmd) {
          termInput.value = cmd;
          termInput.focus();
        }
      });
    });
  }

})();
