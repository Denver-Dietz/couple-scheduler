## 2024-05-24 - MapTiler API Key Exposure
**Vulnerability:** Hardcoded MapTiler API keys in `DestinationsTab.jsx` and fallback strings in `SettingsPanel.jsx`.
**Learning:** Keys were hardcoded directly in style URLs or default fallback fields, making them easily retrievable from the client side bundle.
**Prevention:** Always load third-party API keys dynamically via a secure backend configuration/settings endpoint (like `api.getSettings()`), and use early-return patterns to delay initialization until the configuration is available.
