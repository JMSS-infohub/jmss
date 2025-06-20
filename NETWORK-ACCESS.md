# 🌐 Local Network Access Setup

This guide explains how to access the JMSS Dashboard from other computers on your local network.

## 📋 Quick Setup

### 1. Find Your Local IP Address
```bash
npm run network-info
```

### 2. Start the Server for Network Access
```bash
npm run dev
```

### 3. Access from Other Devices
Other computers/phones/tablets on the same network can access the dashboard using:
- **Your IP**: `http://10.3.50.166:3000` (replace with your actual IP)

## 🔧 Configuration Changes Made

### ✅ Server Binding
- **Before**: Server only accessible on `localhost:3000`
- **After**: Server accessible on `0.0.0.0:3000` (all network interfaces)

### ✅ Scripts Updated
- `npm run dev` - Network access enabled
- `npm run dev-local` - Local-only access (original behavior)
- `npm run network-info` - Shows your local IP addresses

## 🔥 Windows Firewall Setup

When you first start the server, Windows may show a firewall prompt:

1. **Windows Defender Alert** will appear
2. **Click "Allow access"** for both Private and Public networks
3. This allows Node.js to accept incoming connections

### Manual Firewall Configuration
If you missed the popup or need to configure manually:

1. Open **Windows Defender Firewall**
2. Click **"Allow an app or feature through Windows Defender Firewall"**
3. Click **"Change Settings"** → **"Allow another app"**
4. Browse to: `C:\Program Files\nodejs\node.exe`
5. Check both **Private** and **Public** networks
6. Click **OK**

## 📱 Device Compatibility

### ✅ Supported Devices
- **Windows PCs** - Any browser
- **Mac/MacBook** - Any browser  
- **iPhones/iPads** - Safari, Chrome
- **Android phones/tablets** - Chrome, Firefox
- **Smart TVs** - Built-in browsers (if available)

### 🌍 Browser Requirements
- **Chrome** 80+
- **Firefox** 75+
- **Safari** 13+
- **Edge** 80+

## 🛠️ Troubleshooting

### ❌ Can't Connect from Other Devices

1. **Check same network**: All devices must be on the same WiFi
2. **Verify IP address**: Run `npm run network-info` to get current IP
3. **Firewall**: Make sure Windows Firewall allows Node.js
4. **Port availability**: Ensure port 3000 isn't blocked

### ❌ Server Won't Start

```bash
# Try a different port if 3000 is in use
npx next dev -H 0.0.0.0 -p 3001
```

### ❌ IP Address Changed

WiFi routers may assign different IP addresses. If the IP changes:
1. Run `npm run network-info` again
2. Use the new IP address shown

## 🔒 Security Notes

### ⚠️ Local Network Only
- This setup only works on your **local network**
- Other devices must be on the **same WiFi**
- Not accessible from the internet (secure)

### 🔐 Authentication Still Required
- Users still need to log in with their credentials
- Admin/editor permissions are still enforced
- Database security is maintained

## 📞 Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run network-info` | Show local IP addresses |
| `npm run dev` | Start server (network access) |
| `npm run dev-local` | Start server (localhost only) |

**Your Current Network IP**: `10.3.50.166`
**Access URL**: `http://10.3.50.166:3000` 