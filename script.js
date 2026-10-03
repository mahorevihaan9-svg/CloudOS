/**
 * CLOUD OS - Fully Interactive Core
 */

// --- 1. WINDOW MANAGER ---
const WindowManager = {
  highestZ: 10,
  windows: {},

  init() {
    document.querySelectorAll('.window').forEach(win => {
      this.windows[win.id] = {
        element: win,
        isOpen: win.style.display !== 'none',
        isMaximized: false
      };
      this.makeDraggable(win);
      win.addEventListener('mousedown', () => this.focus(win.id));
    });
    this.updateDockDots();
  },

  open(id) {
    const win = this.windows[id];
    if (!win) return;
    
    if (!win.isOpen) {
      win.element.style.display = 'flex';
      win.element.classList.remove('anim-close');
      win.element.classList.add('anim-open');
      win.isOpen = true;
    }
    this.focus(id);
    this.updateDockDots();
  },

  close(id) {
    const win = this.windows[id];
    if (!win) return;
    win.element.classList.remove('anim-open');
    win.element.classList.add('anim-close');
    setTimeout(() => {
      win.element.style.display = 'none';
      win.isOpen = false;
      this.updateDockDots();
    }, 200); 
  },

  focus(id) {
    const win = this.windows[id];
    if (win) {
      this.highestZ++;
      win.element.style.zIndex = this.highestZ;
    }
  },

  toggleMaximize(id) {
    const win = this.windows[id];
    if (!win) return;
    if (!win.isMaximized) {
      win.element.classList.add('maximized');
      win.isMaximized = true;
    } else {
      win.element.classList.remove('maximized');
      win.isMaximized = false;
    }
  },

  makeDraggable(element) {
    const header = element.querySelector('.title-bar');
    if (!header) return;
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    header.onmousedown = (e) => {
      if(e.target.closest('.traffic-lights') || this.windows[element.id].isMaximized) return;
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    };

    function elementDrag(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      element.style.top = (element.offsetTop - pos2) + "px";
      element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  },

  updateDockDots() {
    Object.keys(this.windows).forEach(id => {
      const dot = document.getElementById(`dot-${id}`);
      if (dot) dot.classList.toggle('active', this.windows[id].isOpen);
    });
  }
};

// --- 2. MENU BAR CLOCK ---
setInterval(() => {
  document.getElementById('clock').textContent = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).replace(',', '');
}, 1000);

// --- 3. APP: CLOUD DRIVE & PREVIEW ---
const CloudDrive = {
  files: [
    { id: 1, name: "Serenity.png", type: "image", icon: "🖼️", content: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1080" },
    { id: 2, name: "Neon City.jpg", type: "image", icon: "🖼️", content: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=1080" },
    { id: 3, name: "Ideas.txt", type: "text", icon: "📄", content: "CloudOS Version 26.5 Notes:\n\n- Finished the dynamic blur slider.\n- Preview app correctly parses file types.\n- Everything feels extremely smooth.\n- Need to buy coffee." },
    { id: 4, name: "Projects", type: "folder", icon: "📁" },
    { id: 5, name: "Code Snippets", type: "folder", icon: "📁" }
  ],

  init() {
    this.renderFiles();
  },

  setTab(element) {
    document.querySelectorAll('#drive-sidebar .sidebar-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
  },

  renderFiles() {
    const container = document.getElementById('drive-files');
    container.innerHTML = this.files.map(f => `
      <div class="file-icon" onclick="PreviewApp.openFile(${f.id})" title="Click to open">
        <span class="icon">${f.icon}</span>
        <span>${f.name}</span>
      </div>
    `).join('');
  }
};

const PreviewApp = {
  openFile(id) {
    const file = CloudDrive.files.find(f => f.id === id);
    if (!file || file.type === "folder") {
      // Shake animation or ignore for folders
      return; 
    }

    document.getElementById('preview-title').innerText = file.name;
    const contentBox = document.getElementById('preview-content');

    if (file.type === 'image') {
      contentBox.innerHTML = `<img src="${file.content}" style="max-width:100%; max-height:100%; object-fit:contain; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">`;
    } else if (file.type === 'text') {
      contentBox.innerHTML = `<div style="padding: 32px; color: white; white-space: pre-wrap; font-family: monospace; font-size: 14px; text-align:left; width: 100%; height: 100%; overflow-y:auto;">${file.content}</div>`;
    }

    WindowManager.open('win-preview');
  }
};

// --- 4. APP: SETTINGS (BLUR & WALLPAPER) ---
const SettingsApp = {
  wallpapers: [
    { id: 'wp1', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2560' }, // Serenity
    { id: 'wp2', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2560' }, // Abstract Canvas
    { id: 'wp3', url: 'https://images.unsplash.com/photo-1506744626753-eda8151a74a0?q=80&w=2560' }, // Yosemite
    { id: 'wp4', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2560' }  // Dark Tech
  ],
  activeWallpaper: 'wp1',

  init() {
    // Blur Slider Logic
    const slider = document.getElementById('blur-slider');
    const display = document.getElementById('blur-val-display');
    
    slider.oninput = (e) => {
      const val = e.target.value;
      document.documentElement.style.setProperty('--blur-val', `${val}px`);
      display.innerText = `${val}px`;
    };

    // Render Wallpaper Gallery
    const wpGrid = document.getElementById('wallpaper-grid');
    wpGrid.innerHTML = this.wallpapers.map(wp => `
      <img src="${wp.url}" id="${wp.id}" class="wallpaper-thumb ${wp.id === this.activeWallpaper ? 'active' : ''}" 
           onclick="SettingsApp.changeWallpaper('${wp.id}', '${wp.url}')">
    `).join('');
  },

  setTab(element) {
    document.querySelectorAll('#settings-sidebar .sidebar-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
  },

  changeWallpaper(id, url) {
    // Update CSS Variable
    document.documentElement.style.setProperty('--bg-image', `url('${url}')`);
    
    // Update Active UI Class
    document.querySelectorAll('.wallpaper-thumb').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    this.activeWallpaper = id;
  }
};

// --- 5. APP: NOTES ---
const NotesApp = {
  notes: [
    { id: 1, title: "Meeting Notes", preview: "Discussing OS interactions...", content: "<h2>Meeting Notes</h2><br><p>Decided to make everything fully clickable. Sidebars should update states.</p>" },
    { id: 2, title: "To-Do List", preview: "Buy milk, eggs...", content: "<h2>To-Do List</h2><br><ul><li>Buy Milk</li><li>Write Code</li><li>Sleep (Optional)</li></ul>" }
  ],
  activeId: 1,

  init() {
    this.renderSidebar();
    this.renderContent();
  },

  renderSidebar() {
    const sidebar = document.getElementById('notes-sidebar');
    sidebar.innerHTML = this.notes.map(note => `
      <div class="sidebar-item ${note.id === this.activeId ? 'active' : ''}" onclick="NotesApp.select(${note.id})">
        <div style="font-weight:600; margin-bottom:4px;">${note.title}</div>
        <div style="font-size:11px; opacity:0.7;">${note.preview}</div>
      </div>
    `).join('');
  },

  renderContent() {
    const content = document.getElementById('notes-content');
    const note = this.notes.find(n => n.id === this.activeId);
    content.innerHTML = `<div contenteditable="true" style="padding: 24px; outline: none; min-height: 100%;">${note.content}</div>`;
  },

  select(id) {
    this.activeId = id;
    this.renderSidebar();
    this.renderContent();
  }
};

// --- 6. APP: QUESTLOG ---
const QuestApp = {
  quests: [
    { id: 1, text: "Make settings slider work", done: true },
    { id: 2, text: "Build the Preview App", done: true },
    { id: 3, text: "Enjoy the Serenity", done: false }
  ],
  init() {
    this.render();
    document.getElementById('quest-add-btn').onclick = () => this.addQuest();
    document.getElementById('quest-input').onkeypress = (e) => { if(e.key === 'Enter') this.addQuest(); };
  },
  render() {
    document.getElementById('quest-list').innerHTML = this.quests.map(q => `
      <div class="quest-item">
        <input type="checkbox" ${q.done ? 'checked' : ''} onchange="QuestApp.toggle(${q.id})">
        <span style="text-decoration: ${q.done ? 'line-through' : 'none'}; opacity: ${q.done ? '0.5' : '1'};">${q.text}</span>
      </div>
    `).join('');
  },
  addQuest() {
    const input = document.getElementById('quest-input');
    if (input.value.trim()) {
      this.quests.push({ id: Date.now(), text: input.value.trim(), done: false });
      input.value = '';
      this.render();
    }
  },
  toggle(id) {
    const q = this.quests.find(x => x.id === id);
    if (q) q.done = !q.done;
    this.render();
  }
};

// --- INITIALIZE ALL ---
window.onload = () => {
  WindowManager.init();
  CloudDrive.init();
  SettingsApp.init();
  NotesApp.init();
  QuestApp.init();
  
  // Default windows on launch
  WindowManager.open('win-drive');
  WindowManager.open('win-settings');
};
