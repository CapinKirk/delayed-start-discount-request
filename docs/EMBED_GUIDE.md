# Embed Guide

Add this snippet to your website where you want the chat to appear:

```
<script src="https://<your-deploy-domain>/embed.js" data-chat-config="PUBLIC_WIDGET_CONFIG_ID" async></script>
```

- Get `PUBLIC_WIDGET_CONFIG_ID` from Admin → Widget Settings
- The widget will mask roles and auto-open according to Admin settings
- The widget uses `/api/widget/bootstrap` to retrieve public configuration (Supabase anon, masking, auto-open)
