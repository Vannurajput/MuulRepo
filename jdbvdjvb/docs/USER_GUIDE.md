# MoBrowser User Guide

**Version 1.4.8** | Complete A-to-Z Guide for New Users

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Home Page (New Tab)](#2-home-page-new-tab)
3. [Tabs](#3-tabs)
4. [Windows](#4-windows)
5. [Navigation & Address Bar](#5-navigation--address-bar)
6. [Search & Autocomplete](#6-search--autocomplete)
7. [Bookmarks](#7-bookmarks)
8. [History](#8-history)
9. [Downloads](#9-downloads)
10. [Settings Menu](#10-settings-menu)
11. [Credential Manager](#11-credential-manager)
12. [Database Credentials](#12-database-credentials)
13. [GitHub Sync](#13-github-sync)
14. [Printer Configuration](#14-printer-configuration)
15. [Scheduler (Task Automation)](#15-scheduler-task-automation)
16. [License Key Manager](#16-license-key-manager)
17. [Themes & Appearance](#17-themes--appearance)
18. [Profile & Sign-In](#18-profile--sign-in)
19. [AI Chat](#19-ai-chat)
20. [Security Indicators](#20-security-indicators)
21. [Zoom](#21-zoom)
22. [Context Menus (Right-Click)](#22-context-menus-right-click)
23. [Keyboard Shortcuts](#23-keyboard-shortcuts)
24. [Auto-Updates](#24-auto-updates)
25. [Codex Handshake Badge](#25-codex-handshake-badge)
26. [Home Page Shortcuts](#26-home-page-shortcuts)

---

## 1. Getting Started

### What is MoBrowser?

MoBrowser (also known as MuulBrowser) is a desktop web browser built for developers and professionals. It works just like Chrome or Edge for browsing the web, but it also comes with powerful built-in tools:

- **Database connections** to PostgreSQL, MySQL, SQL Server, SQLite, and MongoDB
- **GitHub integration** for syncing files directly from the browser
- **Receipt printing** for thermal printers
- **Task scheduling** to automate repetitive jobs
- **Credential vault** for securely storing passwords and tokens
- **License key management** for tracking software licenses

### Browser Layout

When you open MoBrowser, you will see:

```
+----------------------------------------------------------------------+
|  [Tab 1] [Tab 2] [+]                              [_ [] X]          |
|  [<] [>] [R]  [  Address Bar / Search               ] [Profile]     |
|                [Bookmark Star]         [Downloads] [GitHub] [Settings]|
|  [Bookmark Bar]                                                       |
+----------------------------------------------------------------------+
|                                                                        |
|                         MOBROWSER                                       |
|                   Fast Modern Open Web Browser                         |
|                                                                        |
|              [    Search the web or type a URL    ]                    |
|                                                                        |
|              [Shortcut 1] [Shortcut 2] [Shortcut 3]                   |
|                                                                        |
|              -------- Exclusive Suite --------                         |
|              Credential Manager | Downloads Hub                        |
|              Print Studio | Git Sync                                   |
|              Data Vault | Bookmarks Studio                             |
|                                                                        |
|                                           [+ Add Shortcut] [Theme]    |
+----------------------------------------------------------------------+
```

**Top Row (Tab Bar):** Your open tabs and the "+" button to create new ones.

**Second Row (Toolbar):** Back, Forward, and Reload buttons on the left. The address bar in the center. Profile, Downloads, GitHub, and Settings buttons on the right.

**Bookmark Bar:** Appears below the toolbar when you have bookmarks saved to the "Bookmarks Bar" folder.

**Main Area:** The web page you are viewing, or the Home Page when you open a new tab.

---

## 2. Home Page (New Tab)

Every time you open a new tab, you see the MoBrowser Home Page. It has several sections:

### Branding

At the top you see:
- "Powered by Muul Origins" tagline
- The MoBrowser "M" logo
- **MOBROWSER** title
- "Fast Modern Open Web Browser" tagline

### Center Search Bar

A large search bar in the middle of the page. You can:
- **Type a website address** (like `google.com`) and press Enter to go there
- **Type a search query** (like `weather today`) and press Enter to search the web

### Shortcut Grid

Below the search bar, you see your saved website shortcuts. These are quick links to websites you visit often. See [Section 26](#26-home-page-shortcuts) to learn how to add shortcuts.

### App Suite Tiles

Six tiles showcasing MoBrowser's built-in tools:
- **Credential Manager** — Securely store tokens, keys, and logins
- **Downloads Hub** — Track, resume, and reopen downloaded files
- **Print Studio** — Print with precision and previews
- **Git Sync** — Push snapshots and sync with GitHub
- **Data Vault** — Browse local and remote data
- **Bookmarks Studio** — Save and organize your favorite sites

### Floating Buttons (Bottom-Right)

- **+ (Add Shortcut)** — Click to add a new website shortcut to the grid
- **Sun/Moon (Theme Toggle)** — Click to switch between light and dark mode

---

## 3. Tabs

Tabs let you have multiple web pages open at the same time, each in its own tab.

### Opening a New Tab

- Click the **+** button at the end of the tab bar
- Or press **Ctrl+T** on your keyboard

### Closing a Tab

- Click the **X** button on the right side of a tab
- Or press **Ctrl+W** or **Ctrl+F4**

### Switching Between Tabs

- **Click** on any tab to switch to it
- **Ctrl+Tab** — move to the next tab (right)
- **Ctrl+Shift+Tab** — move to the previous tab (left)
- **Ctrl+1** through **Ctrl+8** — jump directly to tabs 1 through 8
- **Ctrl+9** — jump to the very last tab

### Reopening a Closed Tab

Accidentally closed a tab? Press **Ctrl+Shift+T** to bring it back. MoBrowser remembers up to 50 recently closed tabs.

### Reordering Tabs

Click and drag a tab left or right to change its position in the tab bar.

### Detaching a Tab

Drag a tab outside the browser window to open it in a new separate window.

### Pinned Tabs

Right-click a tab and choose "Pin" to make it a small fixed-width tab on the left side. Pinned tabs:
- Take up less space (show only the favicon icon)
- Don't show a close button (prevents accidental closing)
- Stay on the left side of the tab bar

To unpin, right-click the pinned tab and choose "Unpin".

### Tab Context Menu

Right-click any tab to see options like:
- Pin / Unpin
- Close tab
- Close other tabs

### Tab Limits

MoBrowser shows up to **28 tabs** at a time. If you have more, only the visible ones are rendered, but all tabs remain accessible.

### Tab Indicators

Each tab shows:
- **Favicon** — the website's small icon
- **Title** — the page title (or "New Tab" for blank tabs)
- **Loading spinner** — appears while a page is loading
- If no favicon is available, the first letter of the title is shown

---

## 4. Windows

### Opening a New Window

- Press **Ctrl+N** on your keyboard
- Or go to **Settings > New Window**

Each window is independent with its own set of tabs.

### Window Controls (Top-Right)

- **Minimize** ( _ ) — shrink the window to the taskbar
- **Maximize / Restore** ( [] ) — make the window full-screen or restore to its previous size
- **Close** ( X ) — close the entire window

### Closing a Window

- Click the **X** button in the top-right corner
- Or press **Alt+F4**

### Window Snapping

MoBrowser automatically adjusts its layout based on window width:
- **Compact** (under 640px wide) — minimal layout
- **Narrow** (640–1024px) — condensed layout
- **Medium** (1024–1280px) — standard layout
- **Full** (over 1280px) — full layout with all controls visible

---

## 5. Navigation & Address Bar

### Navigation Buttons

On the left side of the toolbar:
- **Back Arrow (< )** — go to the previous page (or press **Alt+Left Arrow**)
- **Forward Arrow ( >)** — go to the next page (or press **Alt+Right Arrow**)
- **Reload (circular arrow)** — refresh the current page (or press **F5**)

### Using the Address Bar

The address bar is the large input field in the center of the toolbar.

**To visit a website:**
1. Click the address bar (or press **Ctrl+L**, **Alt+D**, or **F6**)
2. Type the web address (e.g., `www.google.com`)
3. Press **Enter**

**To search the web:**
1. Click the address bar
2. Type your search query (e.g., `best restaurants near me`)
3. Press **Enter**

**Quick search mode:** Press **Ctrl+K** or **Ctrl+E** to focus the address bar in search mode.

### Domain Shortcuts

When typing in the address bar:
- **Ctrl+Enter** — automatically adds `.com` (e.g., type `google` → goes to `google.com`)
- **Ctrl+Shift+Enter** — automatically adds `.org`
- **Shift+Enter** — automatically adds `.net`

### Security Indicator

To the left of the address bar, you will see an icon showing the security status:
- **Lock icon** — Secure connection (HTTPS). Your data is encrypted.
- **Alert icon** — Not secure (HTTP). Your data is not encrypted.
- **Folder icon** — You are viewing a local file on your computer.
- **Settings icon** — This is an internal browser page.

Click the security icon to see more details about the connection.

### Address Overlay

When viewing a web page, the address bar shows the URL with color-coded parts:
- **Scheme** (e.g., `https://`) — shown in lighter color
- **Host** (e.g., `www.google.com`) — shown prominently
- **Path** (e.g., `/search?q=...`) — shown in lighter color

---

## 6. Search & Autocomplete

### How Autocomplete Works

As you type in the address bar, MoBrowser suggests websites from your browsing history:

1. Start typing (e.g., type `y`)
2. MoBrowser automatically completes it to a matching URL (e.g., `youtube.com`)
3. The auto-completed part is highlighted/selected
4. Press **Enter** to go to the suggested URL
5. Keep typing to replace the suggestion with something else
6. Press **Backspace** or **Delete** to clear the suggestion

This works like Chrome's address bar — it learns from your history.

### Center Search Bar

The large search bar on the Home Page works the same way. Type a URL or search query and press Enter.

---

## 7. Bookmarks

Bookmarks let you save your favorite websites for quick access later.

### Adding a Bookmark

**Method 1 — Star Icon:**
1. Navigate to the website you want to bookmark
2. Click the **star icon** on the right side of the address bar
3. A dialog appears with:
   - **Name** — the bookmark's display name (auto-filled with page title)
   - **Folder** — choose "Bookmarks Bar" or "Other Bookmarks"
4. Click **Save**

**Method 2 — Keyboard:**
Press **Ctrl+D** to bookmark the current page.

### Bookmark Bar

The bookmark bar appears below the toolbar and shows bookmarks saved to the "Bookmarks Bar" folder. Click any bookmark to visit that website.

If you have too many bookmarks to fit, click the **>>** overflow button on the right to see the rest.

### Managing Bookmarks

- Click the **folder icon** button on the right of the bookmark bar to see all bookmarks
- To **remove** a bookmark, click the star icon (if the page is already bookmarked) and click "Remove"
- MoBrowser stores up to **100 bookmarks**

---

## 8. History

History shows all the websites you have recently visited.

### Viewing History

- Press **Ctrl+H** on your keyboard
- Or go to **Settings > History**

### History Page

The history page shows a list of recently visited pages with:
- **Favicon** (website icon)
- **Page title**
- **URL**
- **Date and time** of your visit

Click any entry to visit that page again.

### Clearing History

Click the **Clear All** button to delete your entire browsing history. This cannot be undone.

MoBrowser stores the most recent **50** history entries.

---

## 9. Downloads

The Downloads manager shows all files you have downloaded.

### Accessing Downloads

- Click the **download icon** (down arrow) in the toolbar
- Or press **Ctrl+J**
- Or go to **Settings > Download**

### Download List

Each download shows:
- **File name**
- **File size** (in human-readable format like KB, MB)
- **Progress bar** (for downloads still in progress)

### Download Actions

For each downloaded file, you can:
- **Open** — open the file with its default application
- **Reveal in folder** — open the folder where the file was saved
- **Resume** — continue a paused download
- **Cancel** — stop a download in progress

---

## 10. Settings Menu

Click the **three-dot icon** (vertical dots) in the top-right of the toolbar to open the Settings menu.

The settings menu contains these options (in order):

| Option | What It Does |
|--------|-------------|
| **New Tab** | Opens a new blank tab |
| **New Window** | Opens a new browser window |
| **Set as default browser** | Makes MoBrowser your computer's default browser |
| **Download** | Opens the full Downloads page in a new tab |
| **History** | Opens the full History page in a new tab |
| **Scheduler** | Opens the Task Scheduler in a new tab |
| **Skin** | Dropdown to choose appearance: "Glass / Universe" or "Classic" |
| **Credential Manager** | Opens the Credential Manager in a new tab |
| **Print** | Prints the page in the current tab |
| **License Key** | Opens the License Key Manager in a new tab |
| **Zoom** | Shows current zoom level with - / Reset / + buttons |
| **DevTools** | Opens browser developer tools (for advanced users) |
| **Exit** | Closes MoBrowser completely |
| **Check for updates** | Checks if a newer version is available |
| **Version** | Shows the current MoBrowser version number |

---

## 11. Credential Manager

The Credential Manager is MoBrowser's central vault for storing all your credentials, configurations, and connections securely.

### How to Open

Go to **Settings > Credential Manager**. It opens in a new tab.

### Overview

The main page shows a table with all your saved credentials:

| Column | Description |
|--------|------------|
| **Name** | The friendly name you gave this credential |
| **Type** | Badge showing the type: DATABASE, GIT, PRINTER, OTHER, LOCAL |
| **Status** | "Configured" (green) or "Missing" (orange) |
| **Summary** | Brief description of the credential |
| **Actions** | Edit (pencil icon) and Delete (trash icon) buttons |

### Searching Credentials

Use the **search box** at the top to filter credentials by name, type, or summary.

### Adding a New Credential

1. Click the **Add Config** button (top-right)
2. A dropdown menu appears with these options:
   - **Database** — for database connections (PostgreSQL, MySQL, SQL Server, etc.)
   - **Git** — for GitHub repository connections
   - **Printer** — for printer configurations
   - **Other** — for API tokens, keys, or custom credentials
   - **Local** — for local folder paths on your computer
3. Click the type you want to add
4. Fill in the form that appears and save

### Editing a Credential

Click the **pencil icon** next to any credential to open its editor.

### Deleting a Credential

1. Click the **trash icon** next to the credential
2. A confirmation dialog appears: "Delete [name]? This cannot be undone."
3. Click **Delete** to confirm, or **Cancel** to keep it

### Closing

Press **Escape** to close any open editor or modal.

---

## 12. Database Credentials

Database credentials let you connect MoBrowser to databases for running queries and exporting data.

### How to Open

Go to **Credential Manager > Add Config > Database** (or edit an existing database credential).

### Connection Form Fields

| Field | Description |
|-------|------------|
| **Database Type** | Choose from: PostgreSQL, MySQL, SQL Server, SQLite, MongoDB |
| **Connection Name** | A friendly name (e.g., "Production DB" or "Local Test") |
| **Connection ID** | An optional custom identifier |
| **Host** | The database server address (e.g., `localhost` or `db.example.com`) |
| **Port** | The port number (auto-filled: PostgreSQL=5432, MySQL=3306, SQL Server=1433) |
| **Server Name** | For SQL Server only — format: `hostname,1433` or `hostname\SQLEXPRESS` |
| **Database Name** | The name of the specific database to connect to |
| **Username** | Your database username |
| **Password** | Your database password (stored securely in your OS vault) |

**Note:** For SQL Server, the Host and Port fields are replaced with a single Server Name field.

### Advanced Options

Click "Advanced" to expand additional connection settings:

**SSH Tunnel** (for connecting through a jump server):
| Field | Description |
|-------|------------|
| Enable SSH | Turn on SSH tunneling |
| SSH Host | The SSH server address |
| SSH Port | The SSH port (usually 22) |
| SSH User | Your SSH username |
| SSH Password | Your SSH password |
| Private Key | Paste your SSH private key (PEM format) |
| Passphrase | Passphrase for the private key (if any) |
| Remote Host | The database host as seen from the SSH server |
| Remote Port | The database port as seen from the SSH server |

**SSL/TLS** (for encrypted connections):
| Field | Description |
|-------|------------|
| Enable SSL | Turn on SSL/TLS encryption |
| Reject Unauthorized | Whether to reject self-signed certificates |
| Server Name | SSL server name for verification |
| CA Certificate | Paste the CA certificate (PEM) |
| Client Certificate | Paste the client certificate (PEM) |
| Client Key | Paste the client key (PEM) |

**IAM Authentication** (for AWS RDS databases):
| Field | Description |
|-------|------------|
| Enable IAM | Use AWS IAM for authentication instead of password |
| Region | AWS region (e.g., `us-east-1`) |
| Access Key ID | Your AWS access key |
| Secret Access Key | Your AWS secret key |
| Session Token | Optional temporary session token |
| Host | The RDS endpoint |
| Port | The RDS port |

### Testing the Connection

Click **Test Connection** to verify your settings work before saving. You will see:
- "Connection successful" (green) if everything is correct
- An error message (red) if something is wrong

### Saving

Click **Save** to store the credentials. Passwords are encrypted and stored securely in your operating system's credential vault (Windows Credential Manager).

---

## 13. GitHub Sync

GitHub Sync lets you push files and data to a GitHub repository directly from MoBrowser.

### How to Open

- Click the **GitHub icon** in the toolbar (the cat logo)
- Or go to **Credential Manager > Add Config > Git**

### Configuration Form

| Field | Description |
|-------|------------|
| **Personal Access Token (PAT)** | Your GitHub personal access token (generate one at github.com > Settings > Developer settings > Personal access tokens) |
| **Owner** | Your GitHub username or organization name |
| **Repository** | The repository name (e.g., `my-project`) |
| **Branch** | The branch to push to (default: `main`) |
| **Default Path** | The folder path in the repository where files will be saved |
| **Commit Message** | The message used for commits (default: "chore: push from Chromo") |

### Saving the Configuration

1. Fill in all required fields (PAT, Owner, Repository, Default Path)
2. Click **Save**
3. MoBrowser verifies access to the repository
4. If successful, you see: "Connected: owner/repo@branch"
5. If there is an error, you see the error message

### Signing Out

Click **Sign Out** to clear all stored GitHub configuration and disconnect.

### Status Indicator

- **"Connected: owner/repo@branch"** — successfully connected
- **"Not connected"** — no configuration saved yet

---

## 14. Printer Configuration

MoBrowser can print to thermal receipt printers and regular printers.

### How to Open

Go to **Credential Manager > Add Config > Printer**.

### Supported Printer Types

| Type | Description |
|------|------------|
| **USB** | Printers connected via USB cable |
| **Bluetooth** | Wireless Bluetooth printers |
| **Network** | Network printers connected via TCP (port 9100) |
| **System** | Printers installed through Windows printer drivers |

### Printing Modes

- **Graphic Mode** — Full HTML rendering. Supports images, colors, and complex layouts.
- **Text Mode** — ESC/POS monochrome format optimized for 80mm thermal receipt printers.

### Features

- **Logo support** — Add your logo by providing a URL. MoBrowser downloads it and converts it for the printer.
- **Multi-printer routing** — Split print jobs to different printers based on tags (e.g., kitchen printer gets food orders only).
- **USB device scanning** — MoBrowser can detect connected USB printers automatically.

### Quick Print

To print the current web page, go to **Settings > Print** or press **Ctrl+P**.

---

## 15. Scheduler (Task Automation)

The Scheduler lets you automate repetitive tasks that run on a timer or schedule.

### How to Open

Go to **Settings > Scheduler**. It opens in a new tab.

### Page Layout

The Scheduler page has three main areas:
- **Status Bar** (top) — Shows whether the scheduler service is active and how many jobs are enabled
- **Create Job Form** (left panel) — Where you set up new jobs
- **Jobs List** (right panel) — Shows all your existing jobs
- **Activity Log** (bottom) — Shows the history of job executions

### Creating a New Job

1. **Job Name** — Give your job a descriptive name (required)
2. **Job Type** — Choose what the job does:

| Job Type | What It Does | Required Fields |
|----------|-------------|----------------|
| **GitHub Pull** | Downloads files from a GitHub repository | Owner, Repository, Branch, Token, Output Directory |
| **DB Export** | Runs a database query and saves results | DB Type, Credential ID, Database Name, Query, Output Directory |
| **Download** | Downloads a file from a URL | URL, File Name, Output Directory |
| **CLI** | Runs a command-line command | Command, Working Directory, Timeout (optional) |
| **Trigger** | Starts other jobs in sequence | Target Job IDs (comma-separated) |

3. **Schedule** — Choose how often the job runs:
   - **Every X minutes** — enter a number (e.g., `30` for every 30 minutes)
   - **Cron expression** — for advanced scheduling (e.g., `0 9 * * 1-5` for 9 AM on weekdays)

4. Click **Create Job** (submit the form)

### Managing Existing Jobs

Each job in the Jobs List shows:
- **Name** — the job name
- **Status badge** — Pending (gray), Success (green), Error (red), or Paused (gray)
- **Type** — what kind of job it is
- **Schedule** — Cron expression or interval
- **Next Run** — when it will run next
- **Last Run** — when it last ran

**Job Actions:**
| Button | What It Does |
|--------|-------------|
| **Run Now** | Immediately executes the job (doesn't wait for the schedule) |
| **Enable / Disable** | Pauses or resumes the job |
| **Delete** | Permanently removes the job |

### Activity Log

The bottom section shows a history of all job executions with:
- **Status** (success/error)
- **Message** describing what happened
- **Timestamp** when it ran
- **Job ID** which job ran

### Background Service

The Scheduler can run as a **Windows Service** called "MuulScheduler". This means jobs continue running even when MoBrowser is closed. The service is optionally installed during MoBrowser setup.

### Auto-Refresh

The Scheduler page automatically refreshes every **20 seconds** to show the latest job statuses and logs.

---

## 16. License Key Manager

The License Key Manager lets you store and organize software license keys.

### How to Open

Go to **Settings > License Key**. It opens in a new tab.

### Overview

The page shows a table with:
| Column | Description |
|--------|------------|
| **Key** | The license key value |
| **Created** | Date and time when the key was added (DD/MM/YYYY HH:MM format) |
| **Actions** | Edit and Delete buttons |

### Adding a License Key

1. Click the **Add Key** button at the top
2. A modal dialog appears with a text input field
3. Enter the license key value
4. Click **Save**

### Editing a License Key

1. Click the **pencil icon** (Edit) next to the key
2. The modal opens with the current key pre-filled
3. Modify the key value
4. Click **Save**

### Deleting a License Key

1. Click the **trash icon** (Delete) next to the key
2. A confirmation dialog appears: "Delete [key]? This cannot be undone."
3. Click **Delete** to confirm, or **Cancel** to keep it

### Searching License Keys

Use the **search box** at the top to filter keys. It matches against the key value text.

---

## 17. Themes & Appearance

MoBrowser offers customizable visual themes to match your preference.

### Light and Dark Mode

Click the **sun/moon icon** at the bottom-right of the Home Page to switch between:
- **Light Mode** — bright background, dark text
- **Dark Mode** — dark background, light text

The switch is smooth with a brief transition animation. Your choice is saved and remembered across sessions.

### Skins

Go to **Settings > Skin** to choose between:

| Skin | Description |
|------|------------|
| **Glass / Universe** | Modern glassmorphism style with subtle blur effects and transparency. This is the default skin. |
| **Classic** | Clean, flat design with no blur effects. Simpler and faster on older hardware. |

### How Themes Are Applied

- Theme colors are automatically derived from an accent color
- All browser UI elements (toolbar, tabs, popups, settings) follow the chosen theme
- The theme applies to all built-in pages (Credential Manager, Scheduler, etc.)

---

## 18. Profile & Sign-In

### Accessing Your Profile

Click the **person icon** (Profile button) in the toolbar.

### Creating an Account

1. Click the Profile button
2. Choose "Sign In"
3. Fill in:
   - Email address
   - Username
   - Password
4. Click Sign In / Create Account

### Google Sign-In

You can also sign in using your Google account. Click the "Sign in with Google" button and follow the prompts.

### Profile Badge

When signed in, your profile icon in the toolbar updates to show your identity. Click it to see your profile popup or sign out.

---

## 19. AI Chat

MoBrowser includes a built-in AI chat assistant.

### How to Open

Click the **chat icon** (message bubble) in the toolbar. The icon may be hidden if chat is not configured.

### Using the Chat

1. The chat panel slides open on the right side of the browser
2. Type your message in the input field at the bottom
3. Click **Send** or press Enter
4. Your message appears on the right (blue bubble)
5. The AI response appears on the left (gray bubble)
6. "Thinking..." status shows while the AI is processing

### Closing the Chat

Click the **X** button at the top of the chat panel, or click the chat icon again.

---

## 20. Security Indicators

MoBrowser shows you the security status of every website you visit.

### Security Icon (Address Bar)

The icon to the left of the address bar changes based on the connection:

| Icon | Meaning | Description |
|------|---------|------------|
| **Lock** | Secure (HTTPS) | Your connection is encrypted. Safe for passwords and personal data. |
| **Alert triangle** | Not Secure (HTTP) | Your connection is NOT encrypted. Be careful with sensitive information. |
| **Folder** | Local File | You are viewing a file stored on your computer. |
| **Settings gear** | Internal Page | This is a built-in MoBrowser page (like Settings or Credential Manager). |

### Security Popover

Click the security icon to see a popup with:
- **Connection status** (e.g., "Secure connection" or "Not secure")
- **Host name** of the website
- **Description** explaining what the status means

---

## 21. Zoom

You can zoom in or out on any web page. Each tab remembers its own zoom level.

### Zoom Shortcuts

| Action | Keyboard Shortcut |
|--------|------------------|
| **Zoom In** | Ctrl + = (or Ctrl + Numpad +) |
| **Zoom Out** | Ctrl + - (or Ctrl + Numpad -) |
| **Reset to 100%** | Ctrl + 0 (or Ctrl + Numpad 0) |

### Zoom Indicator

When you zoom in or out, a small popup appears near the toolbar showing:
- The current zoom percentage (e.g., "125%")
- **-** button to zoom out
- **+** button to zoom in
- **Reset** button to go back to 100%

The popup automatically hides after 1.5 seconds.

### Zoom in Settings

You can also control zoom from **Settings > Zoom**, which shows the same minus / percentage / plus controls.

### Home Page Scaling

The Home Page content (logo, search bar, shortcuts) scales along with the zoom level to maintain a consistent look.

---

## 22. Context Menus (Right-Click)

Right-clicking shows different menus depending on what you click on.

### Right-Click on a Web Page

**On normal text:**
- **Back** — go to previous page
- **Forward** — go to next page
- **Reload** — refresh the page
- **Inspect Element** — opens developer tools at that element

**On selected text:**
- **Copy** — copy the selected text
- **Search Google for "..."** — search the selected text on Google (opens in new tab)

**On a link:**
- **Open link in new tab** — opens the link in a new tab
- **Copy link address** — copies the URL to your clipboard

**On an image:**
- **Open image in new tab** — opens the full image in a new tab
- **Copy image address** — copies the image URL to your clipboard

**In a text input field:**
- **Undo** — undo your last edit
- **Redo** — redo what you undid
- **Cut** — cut selected text
- **Copy** — copy selected text
- **Paste** — paste from clipboard
- **Select All** — select all text in the field

### Right-Click on a Tab

Right-clicking a tab opens a tab context menu popup with options like:
- **Pin / Unpin** the tab
- **Close** the tab
- **Close other tabs**

---

## 23. Keyboard Shortcuts

Here is the complete list of keyboard shortcuts available in MoBrowser:

### Tab Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl+T** | Open a new tab |
| **Ctrl+W** | Close the current tab |
| **Ctrl+F4** | Close the current tab (alternative) |
| **Ctrl+Shift+T** | Reopen the last closed tab |
| **Ctrl+Tab** | Switch to the next tab |
| **Ctrl+Shift+Tab** | Switch to the previous tab |
| **Ctrl+1** to **Ctrl+8** | Jump to tab 1 through 8 |
| **Ctrl+9** | Jump to the last tab |

### Window Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl+N** | Open a new window |
| **Alt+F4** | Close the current window |

### Navigation Shortcuts

| Shortcut | Action |
|----------|--------|
| **Alt+Home** | Go to the home page |
| **Alt+Left Arrow** | Go back |
| **Alt+Right Arrow** | Go forward |
| **F5** | Reload the page |
| **Shift+F5** | Reload ignoring cache (hard reload) |
| **Ctrl+R** | Reload the page |
| **Ctrl+Shift+R** | Reload ignoring cache |

### Address Bar Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl+L** | Focus the address bar (select all text) |
| **Alt+D** | Focus the address bar (select all text) |
| **F6** | Focus the address bar (select all text) |
| **Ctrl+K** | Focus the address bar in search mode |
| **Ctrl+E** | Focus the address bar in search mode |
| **Ctrl+Enter** | Add .com to what you typed and go |
| **Ctrl+Shift+Enter** | Add .org to what you typed and go |
| **Shift+Enter** | Add .net to what you typed and go |

### Feature Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl+D** | Bookmark the current page |
| **Ctrl+J** | Open Downloads |
| **Ctrl+H** | Open History |
| **Ctrl+F** | Find text on the page |
| **Ctrl+P** | Print the current page |
| **Ctrl+S** | Save the current page |
| **Ctrl+U** | View page source code |

### Zoom Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl+=** | Zoom in |
| **Ctrl+-** | Zoom out |
| **Ctrl+0** | Reset zoom to 100% |

### Developer Shortcuts

| Shortcut | Action |
|----------|--------|
| **F12** | Open Developer Tools |
| **Ctrl+Shift+I** | Open Developer Tools (alternative) |

### General Shortcuts

| Shortcut | Action |
|----------|--------|
| **Escape** | Close the current popup, modal, or dialog |

---

## 24. Auto-Updates

MoBrowser can automatically check for and install updates.

### How It Works

1. **Auto-check** — When you open the Settings menu, MoBrowser automatically checks for updates
2. **Manual check** — Click "Check for updates" in Settings to manually check
3. **Download** — If an update is available, it downloads automatically. You see the progress percentage.
4. **Install** — When the download finishes:
   - The Settings row changes to "Restart to upgrade"
   - A "Restart to Update" button appears
5. **Restart** — Click the button (or the row) to restart MoBrowser and install the update

### Update Statuses

| Status | Meaning |
|--------|---------|
| Checking for updates... | Looking for a new version |
| Update available. Downloading... | A new version was found and is being downloaded |
| Downloading update (X%)... | Shows download progress |
| Update ready. Restart to install. | Download complete, ready to install |
| You're up to date. | You already have the latest version |
| Update error | Something went wrong (check your internet connection) |

---

## 25. Codex Handshake Badge

In the toolbar, you may see a small badge that says **"No Codex Handshake"** (in gray).

### What It Means

This badge indicates whether the website you are visiting supports MoBrowser's integration protocol (called "Codex Handshake"). When a website supports it:
- The badge changes color to indicate a successful connection
- The website can communicate with MoBrowser's built-in tools (database, printing, file system, etc.)

For most regular websites, this badge will show "No Codex Handshake" — this is normal and does not affect your browsing.

---

## 26. Home Page Shortcuts

The Home Page has a customizable grid of website shortcuts for quick access to your favorite sites.

### Adding a Shortcut

1. On the Home Page, click the **+** floating button (bottom-right corner)
2. A dialog appears with two fields:
   - **Name** — a short name for the shortcut (up to 40 characters)
   - **URL** — the full web address (e.g., `https://google.com`)
3. Click **Done** to save

### Using Shortcuts

Click any shortcut tile on the Home Page to open that website in the current tab.

### Editing or Removing Shortcuts

Click and interact with existing shortcuts to edit their name/URL or remove them from the grid.

---

## Frequently Asked Questions

### How do I set MoBrowser as my default browser?
Go to **Settings > Set as default browser**. Your operating system's default apps settings will open.

### Where are my credentials stored?
Passwords and tokens are stored securely in your operating system's credential vault (Windows Credential Manager via keytar). Configuration files are stored in your user data folder, but sensitive values like passwords are never saved in plain text files.

### Can I use MoBrowser with multiple monitors?
Yes. You can open multiple windows (Ctrl+N) and place them on different monitors. Each window has its own set of tabs.

### How do I find text on a page?
Press **Ctrl+F** to open the find-in-page search bar. Type your search term to highlight matches on the page.

### How do I clear my browsing data?
- **History**: Press Ctrl+H, then click "Clear All"
- **Credentials**: Open Credential Manager and delete individual entries

### The scheduler keeps running when MoBrowser is closed?
Yes, if the MuulScheduler Windows Service was installed during setup. It runs independently in the background. You can manage it from the Scheduler page.

### How do I check which version I have?
Open **Settings** — the version number is shown at the bottom of the menu.

---

*This guide covers MoBrowser version 1.4.8. Features may change in future updates.*
