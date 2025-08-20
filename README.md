# ⚡ Salesforce Utils: Quick Login & Data Inspector  

**Salesforce Utils** is an **all-in-one browser extension** designed to supercharge your Salesforce productivity.  
It combines the most powerful features of **Salesforce Inspector** with a **fast and secure anonymous login system**, allowing you to inspect, edit, and search Salesforce data in a simple, efficient, and secure way.  

---

## ✨ Key Features  

⚡ **Quick Anonymous Login**  
Log in as any user in your org with just one click.  
- Opens a new **incognito window** using the secure **frontdoor.jsp** technique.  
- Keeps your main session untouched.  
- Perfect for **profile testing, troubleshooting, and support**.  

🔍 **Smart Data Inspector**  
View **all fields and values** of a record without switching screens.  
- Right-click → *Inspect Record (API)*.  
- Instantly access **API names, labels, and field types**.  

✏️ **Mass Record Editing**  
Go beyond viewing — **edit multiple fields at once**.  
- Enter mass-edit mode directly in the table.  
- Save everything with **a single API call**.  

🔎 **Intelligent Search & Filtering**  
Quickly find what you need:  
- Filter the user list in the login popup.  
- Filter fields in the record inspector (by label, API name, or value).  

✅ **Secure & Efficient**  
Built with **security and performance** in mind.  
- Reads only the required session cookies.  
- Works exclusively on authorized Salesforce pages.  

---

## 🚀 How to Use  

### 1. Quick Login As  
1. Open any page in your Salesforce org.  
2. Click the **Salesforce Utils** icon in your browser toolbar.  
3. The list of users will automatically load.  
4. Use the search bar to quickly find a user.  
5. Click **Login** → a new incognito window will open, logged in as that user.  

### 2. Record Inspector & Editor  
1. Open any record page in Salesforce Lightning (Account, Contact, Opportunity, etc.).  
2. Right-click anywhere and select **Inspect Record (API)**.  
3. A new tab will display a full table with all fields and values.  
4. Use the search bar to filter fields by label, API name, or value.  
5. Click **Edit All Fields** to switch to edit mode.  
6. Save changes with a single click.  

---

## 🛠️ Installation  

### Install from Chrome Web Store *(Recommended)*  
👉 Coming soon (once published).  

### Install from Source *(For Developers)*  
1. Download or clone this repository.  
2. Open Chrome and go to `chrome://extensions`.  
3. Enable **Developer Mode**.  
4. Click **Load unpacked**.  
5. Select the project folder.  
6. The **Salesforce Utils** extension will appear in your extensions list.  

---

## 🛡️ Permissions & Privacy  

Your privacy and data security are our top priority. The extension only requests the **minimum required permissions**:  

- **cookies** → Read the session cookie (*sid*) to securely authenticate API calls.  
- **host_permissions** → Communicate only with Salesforce domains.  
- **tabs** → Identify the correct org domain and manage redirects/tabs.  
- **scripting** → Extract the *recordId* from the current page URL.  
- **contextMenus** → Add the *Inspect Record (API)* right-click shortcut.  

🔒 **No data is ever sent to external servers.** Everything is processed **locally in your browser**.  

---

⚡ Salesforce Utils = **Faster logins. Smarter data access. Seamless record editing.**
