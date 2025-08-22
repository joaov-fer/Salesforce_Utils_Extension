# Privacy Policy for Salesforce Utils Extension

**Last Updated:** August 20, 2025  

This Privacy Policy describes how the **"Salesforce Utils" browser extension** ("we", "us", "our", or "the extension") handles information and data in connection with your use of the extension.  

Your privacy is critically important to us.  
Our fundamental policy is simple: **your Salesforce information belongs to you and your organization, and we do not store or share it.**

Our extension is designed to operate entirely within your browser, acting as a bridge between you and your organization's Salesforce APIs.  

---

## 1. Information Collection and Use  

Salesforce Utils does **NOT** collect, store, transmit to external servers, or share any personal or sensitive user data.  
All data processing activity occurs locally within your browser.  

To provide its features, the extension needs to access certain information on a temporary basis:

### Salesforce Session Cookie (sid)  
The extension reads the Salesforce session cookie (`sid`) from Salesforce domains (`*.salesforce.com`, `*.lightning.force.com`, etc.) for two sole purposes:

1. **To Authenticate API Calls**  
   - For features like the **Data Inspector** and **Record Editor** to function, the extension must make authenticated calls to the Salesforce REST API on your behalf.  
   - The session cookie is used to obtain the necessary session key to authorize these API calls securely.  

2. **To Enable Quick Anonymous Login**  
   - For the **Quick Login As** feature, the extension uses your session ID to construct a secure `frontdoor.jsp` URL.  
   - This allows you to open a new incognito window as another user without having to log out of your main session.  

### Salesforce Data and Metadata  
- When you use the **Inspect Record** feature, the extension makes real-time API calls to fetch the data and metadata of the record you are viewing.  
- This information is displayed only to you on the inspector page and is never saved or sent outside of your browser.  
- When you use the editing feature, the data you modify is sent directly to the Salesforce API and nowhere else.  

---

## 2. Data Storage  

Salesforce Utils is a **stateless application**.  
- None of your Salesforce data — including your session cookie or the data from records you view — is ever stored by the extension, either locally on your computer or on any remote server.  
- All information is used only at the moment of action and is immediately discarded afterward.  

---

## 3. Data Sharing  

- We do **not** share, sell, or transfer any data accessed by the extension with any third parties.  
- Since we do not store your data, there is nothing to share.  

---

## 4. Justification of Permissions  

The extension requests a minimal set of permissions required for its operation:

- **cookies**  
  Necessary to read the Salesforce session cookie for API authentication (see Section 1).  

- **host_permissions** (`*://*.salesforce.com/`, etc.)  
  Necessary to allow the extension to make secure fetch calls to Salesforce APIs and to activate its features only on relevant Salesforce pages.  

- **tabs**  
  Necessary to get the URL of your active tab.  
  This allows us to identify the correct Salesforce domain for building API and login URLs, and to ensure the retURL feature redirects you back to the correct page.  

- **scripting**  
  Used only for the **Inspect Record** feature.  
  The extension injects a script to read the page URL and extract the record ID, allowing us to fetch the correct data.  

- **contextMenus**  
  Used to add the **Inspect Record (API)** shortcut to the right-click menu, providing quick and integrated access.  

---

## 5. Changes to This Privacy Policy  

We may update our Privacy Policy from time to time.  
We will notify you of any changes by posting the new Privacy Policy on this page.  

You are advised to review this Privacy Policy periodically for any changes.  

---

## 6. Contact Us  

If you have any questions about this Privacy Policy, please contact us by email:  

📧 **joaovitoruser@gmail.com**
