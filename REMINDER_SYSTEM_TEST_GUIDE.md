# PCL Daily Reminder System - Complete Testing Guide

## 🎯 Status Summary

### ✅ Already Implemented:
- `SendDailyReminder` command scheduled to run daily at **19:00** (7 PM)
- Checks which PCL haven't uploaded reports **today**
- Sends FCM notifications to PCL + summary to PML
- Firebase frontend setup complete (auto-token registration)
- Database migration ready (fcm_token column)

### ⚠️ Still Need To Do (For Full Functionality):
1. **Generate Firebase service account JSON** from Firebase Console
2. **Test the reminder** locally
3. **Configure .env** with `FCM_SERVICE_ACCOUNT_PATH` and `FCM_PROJECT_ID`

---

## 📋 How the Reminder System Works

### Daily Flow (Auto at 19:00):
```
1. Schedule triggers "send:daily-reminder" command
   ↓
2. Query all PCL users in database
   ↓
3. For each PCL:
   - Check: Do they have Laporan (report) with TODAY's date?
   - NO → Add to "missing" list
   - YES → Skip them
   ↓
4. For each missing PCL:
   - IF they have FCM token → Send notification:
     "Halo [Nama PCL], silakan submit laporan harian Anda untuk hari ini"
   ↓
5. For each PML (supervisor):
   - Group their missing PCLs
   - Send summary: "Reminder: Ada X PCL belum submit laporan"
   ↓
6. Done ✓
```

### Example Scenario:
```
Database State:
- PCL "Budi" - user.fcm_token exists
- PCL "Ani" - user.fcm_token exists  
- No laporan for Budi or Ani for today

Command Runs at 19:00:
→ Sends notification to Budi: "silakan submit laporan..."
→ Sends notification to Ani: "silakan submit laporan..."
→ Sends summary to their PML: "Ada 2 PCL belum submit laporan"
```

---

## 🚀 Testing on Localhost

### Prerequisites:
- ✅ Laravel app running (`php artisan serve`)
- ✅ Frontend built (`npm run dev`)
- ✅ At least 2 test users (1 PCL, 1 PML)
- ✅ Browser supports notifications (Chrome, Edge, Firefox)

### Step 1: Verify Database Migration

```bash
# Check if fcm_token column exists
php artisan tinker
> DB::select("PRAGMA table_info(users)");

# Should show: fcm_token (nullable string)
```

If not, run migration:
```bash
php artisan migrate
```

### Step 2: Create Test Data (if needed)

```bash
php artisan tinker

# Create test PCL without report for today
> $user = User::create(['nama' => 'Test PCL', 'email' => 'testpcl@test.com', 'password' => bcrypt('password'), 'role' => 'PCL']);
> $pcl = Pcl::create(['nama_pcl' => 'Test PCL', 'user_id' => $user->id]);
> $pml = Pml::first(); // Get existing PML
> $pcl->pmls()->attach($pml->id);

# Verify (no report for today)
> Laporan::where('pcl_id', $pcl->id)->whereDate('tanggal', today())->exists();
# Output: false (good!)

> exit
```

### Step 3: Test in Log Mode (No FCM service account needed!)

```bash
# See what would be sent WITHOUT actually sending
php artisan test:reminder-system --log

# Output example:
# ❌ Test PCL - No report on 2026-06-08 (Token: NONE)
# Total missing PCLs: 1
# Summary by PML...
```

### Step 4: Register FCM Token

1. **Open browser** → http://localhost:8000
2. **Login** as a PCL user
3. **Browser will ask** "Allow notifications?" → Click **Allow**
4. **Check database**:

```bash
php artisan tinker
> Auth::logout();
> $pcl_user = User::where('role', 'PCL')->first();
> $pcl_user->fcm_token;
# Should show: "fG42u7b3n8Pm..." (some long token)
```

### Step 5: Test Reminder Detection

```bash
# Now check what needs reminders
php artisan test:reminder-system --log

# Should show:
# ✓ Test PCL - Has token: fG42u...
# Missing Reports: 1/1
```

### Step 6: Configure FCM V1 Service Account (For Actual Notifications)

#### Get Firebase service account JSON:
1. Go to: https://console.firebase.google.com
2. Select project: **monitoring-afb38**
3. Click **⚙️ Project Settings**
4. Go to **Service accounts** tab
5. Click **Generate new private key**
6. Download the JSON file and place it in your project root

#### Add to .env:
```env
FCM_SERVICE_ACCOUNT_PATH=firebase-service-account.json
FCM_PROJECT_ID=monitoring-afb38
```

### Step 7: Test Sending Notifications

```bash
# With FCM V1 credentials configured, actually send
php artisan test:reminder-system --send

# Output:
# ✓ Notification sent to Test PCL
# Notifications Sent: 1
```

### Step 8: Receive Notification on Device

1. **Keep browser window/tab open** with app logged in
2. Run command from another terminal:
   ```bash
   php artisan test:reminder-system --send
   ```
3. **Check your browser** → Should see notification!

---

## 🔧 Advanced Testing Options

### Test Specific Date:
```bash
# Check reminders for yesterday
php artisan test:reminder-system --log --date=2026-06-07

# Check reminders for specific date
php artisan test:reminder-system --log --date=2026-06-05
```

### Test Scheduled Command (Auto at Time):

#### Terminal 1: Start Laravel Scheduler
```bash
php artisan schedule:work

# This runs scheduler every minute
# At 19:00, it will auto-execute the command
```

#### Terminal 2: Make requests to trigger it
```bash
# Make any request to app - scheduler checks if command should run
curl http://localhost:8000/dashboard

# Check logs to see if command ran at 19:00
tail -f storage/logs/laravel.log
```

### View Command Logs:
```bash
# Check recent executions
tail -50 storage/logs/laravel.log | grep -i "reminder\|daily"
```

---

## 📱 How to Test on Multiple Devices

### Scenario: Test PCL on Phone, PML on Laptop

#### 1. Get your localhost IP:
```bash
ipconfig  # Windows
# or
ifconfig  # Mac/Linux

# Find your IPv4 address, e.g., 192.168.1.100
```

#### 2. Update Laravel URL (temporary):
```bash
# In .env
APP_URL=http://192.168.1.100:8000

# Or just remember the IP
```

#### 3. On phone:
- Connect to same WiFi as laptop
- Open: `http://192.168.1.100:8000`
- Login as PCL user
- Allow notifications

#### 4. On laptop (PML):
- Open: `http://localhost:8000`
- Login as PML user
- Allow notifications

#### 5. Run test:
```bash
php artisan test:reminder-system --send

# Both devices should receive notifications!
```

---

## ❌ Troubleshooting

### Problem 1: "FCM credentials not configured"
**Reason**: Missing service account JSON path or project ID in .env
**Solution**: 
```
1. Generate service account JSON from Firebase Console
2. Add to .env: FCM_SERVICE_ACCOUNT_PATH=firebase-service-account.json
3. Add to .env: FCM_PROJECT_ID=monitoring-afb38
4. Run command again
```

### Problem 2: "No notifications received"
**Check list**:
- [ ] Browser permissions granted? (Check browser settings)
- [ ] User has FCM token? (`php artisan tinker` → `Auth::user()->fcm_token`)
- [ ] Laravel app is running? (`php artisan serve`)
- [ ] Browser tab is open/active?
- [ ] FCM service account configured? (`.env` file and JSON path)
- [ ] Service worker registered? (Check DevTools → Application → Service Workers)

### Problem 3: "FCM token is NULL in database"
**Possible causes**:
1. Browser permission denied → Re-login and grant permission
2. Service worker failed to register → Check browser console for errors
3. App not served over HTTPS/localhost → Use localhost only

**Solution**:
```bash
# Clear everything and re-test
1. Clear browser cache/cookies
2. Logout from app
3. Close browser completely
4. Reopen and login again
5. Grant notifications permission
6. Check database again
```

### Problem 4: "Service Worker registration failed"
**Solution**:
```bash
# Check browser console (F12)
# Look for errors mentioning:
# - CORS issues → Make sure app is on same origin
# - HTTPS required → Must use localhost or HTTPS
# - File not found → Check /public/firebase-messaging-sw.js exists

# If file missing, restart dev server:
npm run dev
```

### Problem 5: "Scheduled command not running at 19:00"
**For localhost testing**:
```bash
# Option A: Run command manually (recommended)
php artisan send:daily-reminder

# Option B: Use schedule:work in terminal
php artisan schedule:work
# Then make requests to trigger (curl, browser refresh)
```

**Note**: Scheduled commands need HTTP requests to trigger. Just running the artisan server doesn't trigger them automatically. You need either:
- A process running `schedule:work` in background, OR
- A cron job configured (production only), OR
- Call command manually for testing

---

## 📊 Helper Commands

```bash
# See what would happen (no notifications sent)
php artisan test:reminder-system --log

# Actually send reminders
php artisan test:reminder-system --send

# Check specific date
php artisan test:reminder-system --log --date=2026-06-05

# Run the actual daily command
php artisan send:daily-reminder

# List all scheduled commands
php artisan schedule:list

# Run scheduler for monitoring (separate terminal)
php artisan schedule:work
```

---

## 🔑 Firebase Configuration in .env

Required keys (already configured):
```env
MIX_FIREBASE_API_KEY=AIzaSyCyg0UnSvbI_j--F690swXWWgz0dUQuFis
MIX_FIREBASE_AUTH_DOMAIN=monitoring-afb38.firebaseapp.com
MIX_FIREBASE_PROJECT_ID=monitoring-afb38
MIX_FIREBASE_STORAGE_BUCKET=monitoring-afb38.firebasestorage.app
MIX_FIREBASE_MESSAGING_SENDER_ID=477576003667
MIX_FIREBASE_APP_ID=1:477576003667:web:f71e0b99ac0a8946e006a6
MIX_FIREBASE_VAPID_KEY=BOkwpoaz4f6_jsWq6m7vbBjeXSLX81gQGRKDzYD-EHNT7s7YklvXmAmkz6Pe2An0ZW7waErHkgf2QEffZ9GObFE
```

Still needed (for actual notifications):
```env
FCM_SERVICE_ACCOUNT_PATH=firebase-service-account.json
FCM_PROJECT_ID=monitoring-afb38
```

---

## 📁 Key Files to Review

| File | Purpose |
|------|---------|
| `app/Console/Commands/SendDailyReminder.php` | Main reminder command |
| `app/Console/Commands/TestReminderSystem.php` | Helper testing command |
| `app/Services/FcmService.php` | Sends FCM notifications |
| `app/Http/Controllers/DeviceController.php` | Stores FCM tokens |
| `resources/js/fcm-register.js` | Frontend token registration |
| `public/firebase-messaging-sw.js` | Service Worker for notifications |
| `app/Console/Kernel.php` | Schedule configuration |

---

## ✨ Next Steps

1. **Generate Firebase service account JSON** from Firebase Console
2. **Update .env** with `FCM_SERVICE_ACCOUNT_PATH` and `FCM_PROJECT_ID`
3. **Run**: `php artisan test:reminder-system --log` to verify setup
4. **Test**: `php artisan test:reminder-system --send` to send actual notifications
5. **Monitor**: Check app logs: `tail -f storage/logs/laravel.log`

Good luck! 🚀
