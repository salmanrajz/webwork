# 🚫 WebWork Restriction System Setup Guide

## **Overview**
The WebWork Restriction System allows administrators to block, alert, or limit access to specific websites and URLs. This system works in real-time with the desktop application to monitor and control employee web browsing.

## **🔧 Backend Setup**

### **1. Database Models**
The system includes two new models:
- **RestrictionRule** - Stores blocking rules and policies
- **RestrictionViolation** - Tracks all violations and overrides

### **2. API Endpoints**
All restriction management is available through REST API:

#### **Rule Management:**
- `GET /api/restrictions/rules` - Get all rules
- `POST /api/restrictions/rules` - Create new rule
- `PUT /api/restrictions/rules/:id` - Update rule
- `DELETE /api/restrictions/rules/:id` - Delete rule

#### **Real-time Checking:**
- `POST /api/restrictions/check` - Check if URL is restricted
- `POST /api/restrictions/violations` - Record violation

#### **Violation Management:**
- `GET /api/restrictions/violations` - Get violation history
- `PUT /api/restrictions/violations/:id/acknowledge` - Acknowledge violation

## **🖥️ Frontend Access**

### **1. Navigation**
- Go to **Sidebar** → **🚫 Restrictions** (Admin only)
- URL: `/restrictions`

### **2. Dashboard Features**
- **Stats Overview** - Total rules, active rules, violations
- **Rules Table** - View, edit, delete all restriction rules
- **Violations Table** - Monitor and acknowledge violations
- **Create New Rule** - Add new restrictions

## **📋 How to Create Restrictions**

### **Step 1: Access Restrictions Page**
1. Login as Admin
2. Click **🚫 Restrictions** in sidebar
3. Click **+ Add New Rule**

### **Step 2: Configure Rule**
- **Rule Name**: "Block YouTube"
- **Target Type**: Domain
- **Target Value**: "youtube.com"
- **Rule Type**: Block
- **Severity**: High
- **Applies To**: All Users
- **Alert Message**: "YouTube is blocked during work hours"

### **Step 3: Common Restrictions**
Here are some popular restrictions to set up:

#### **Social Media Blocking:**
```
Name: Block Facebook
Target: facebook.com
Type: Block
Severity: Medium
```

```
Name: Block Twitter
Target: twitter.com
Type: Block
Severity: Medium
```

```
Name: Block Instagram
Target: instagram.com
Type: Block
Severity: Medium
```

#### **Entertainment Blocking:**
```
Name: Block YouTube
Target: youtube.com
Type: Block
Severity: High
```

```
Name: Block Netflix
Target: netflix.com
Type: Block
Severity: High
```

#### **Gaming Blocking:**
```
Name: Block Gaming Sites
Target: steam.com
Type: Block
Severity: High
```

### **Step 4: Time-based Restrictions**
You can also set time-based rules:
- **Work Hours Only**: Block sites only during 9 AM - 5 PM
- **Weekdays Only**: Block sites Monday-Friday
- **Custom Schedules**: Different rules for different times

## **🎯 Rule Types Explained**

### **1. Block**
- **What it does**: Completely prevents access
- **User experience**: Desktop notification + modal popup
- **Use case**: Block distracting sites completely

### **2. Alert**
- **What it does**: Allows access but notifies admin
- **User experience**: Warning notification
- **Use case**: Monitor but don't block certain sites

### **3. Time Limit**
- **What it does**: Sets daily time limits
- **User experience**: Warning when limit reached
- **Use case**: Allow limited access to certain sites

## **📊 Monitoring Violations**

### **Real-time Monitoring**
- **Desktop App** monitors all browser activity
- **Instant Alerts** when restricted sites are accessed
- **Violation Logging** for admin review

### **Admin Dashboard**
- **View All Violations** - See who accessed what
- **Acknowledge Violations** - Mark as reviewed
- **Filter by User/Date/Severity** - Find specific violations
- **Export Reports** - Generate violation reports

## **⚙️ Advanced Configuration**

### **User-Specific Rules**
- **Target Specific Users**: Different rules for different employees
- **Team-Based Rules**: Apply rules to entire teams
- **Role-Based Rules**: Different rules for different roles

### **Severity Levels**
- **Low**: Gentle reminder
- **Medium**: Warning notification
- **High**: Strong warning with logging
- **Critical**: Immediate alert to admin

### **Time Restrictions**
- **Work Hours**: 9 AM - 5 PM, Monday-Friday
- **Custom Hours**: Set specific time ranges
- **Day Restrictions**: Block on specific days

## **🚀 Getting Started**

### **Quick Setup (5 minutes):**
1. **Login as Admin**
2. **Go to Restrictions page**
3. **Create these basic rules:**
   - Block YouTube (High severity)
   - Block Facebook (Medium severity)
   - Block Twitter (Medium severity)
4. **Test with desktop app**
5. **Monitor violations**

### **Advanced Setup (15 minutes):**
1. **Set up time-based rules**
2. **Create user-specific restrictions**
3. **Configure severity levels**
4. **Set up violation monitoring**
5. **Train team on new policies**

## **📱 Desktop App Integration**

### **Automatic Monitoring**
- **Real-time URL checking** against all active rules
- **Instant notifications** when violations occur
- **Activity logging** for all website visits
- **Productivity scoring** based on site categories

### **User Experience**
- **Clear violation alerts** with rule details
- **Severity indicators** (Low/Medium/High/Critical)
- **Acknowledgment options** for violations
- **Activity transparency** in event logs

## **🔒 Security & Privacy**

### **Data Protection**
- **Local processing** of URL checking
- **Encrypted communication** with backend
- **No browsing history storage** (only violations)
- **User consent** for monitoring

### **Admin Controls**
- **Granular permissions** for rule management
- **Audit trails** for all rule changes
- **Override capabilities** for emergencies
- **Compliance reporting** for violations

## **📈 Benefits**

### **For Organizations:**
- **Increased Productivity** - Block distracting sites
- **Policy Enforcement** - Ensure compliance
- **Real-time Monitoring** - Know what's happening
- **Detailed Reporting** - Track productivity trends

### **For Employees:**
- **Clear Boundaries** - Know what's allowed
- **Fair Policies** - Consistent rules for all
- **Transparency** - See what's being monitored
- **Focus Support** - Help stay on task

## **🆘 Troubleshooting**

### **Common Issues:**
1. **Rules not working**: Check if rule is active
2. **No notifications**: Check desktop app is running
3. **False positives**: Adjust target values
4. **Performance issues**: Reduce rule complexity

### **Support:**
- **Check logs** in desktop app
- **Verify API connectivity** to backend
- **Test rules** with simple domains first
- **Contact admin** for rule adjustments

---

**The WebWork Restriction System is now ready to help you manage employee productivity and enforce company policies!** 🎉

