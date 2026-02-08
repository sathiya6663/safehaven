# SafeHaven User Acceptance Testing Guide

## Overview

This guide provides comprehensive test scenarios, scripts, and checklists for conducting User Acceptance Testing (UAT) with real users across different age groups and user types.

## Testing Team Structure

### Required Testers
- **Women Users**: 5-10 adult women (ages 18-65)
- **Child Users**: 5-10 children (ages 8-17) with parental supervision
- **Guardian Users**: 5-10 parents/guardians
- **Accessibility Testers**: 2-3 users with disabilities

### Testing Environment
- **Devices**: Mobile phones (iOS/Android), tablets, desktops
- **Browsers**: Chrome, Safari, Firefox, Edge
- **Network**: Test on WiFi, 4G, and slow 3G connections

---

## Test Scenarios by User Type

### 1. Woman User Scenarios

#### Scenario W1: First-Time Registration
**Objective**: Complete registration and profile setup
**Steps**:
1. Open SafeHaven app
2. Click "Get Started"
3. Select "Woman" as user type
4. Enter email and create password
5. Verify password strength indicator works
6. Complete profile setup with emergency contacts
7. Verify dashboard loads correctly

**Expected Results**:
- Registration completes without errors
- Password strength indicator shows appropriate level
- Profile saved successfully
- Dashboard shows personalized greeting

**Feedback Questions**:
- Was the registration process intuitive?
- Did you feel secure providing your information?
- Were any steps confusing?

---

#### Scenario W2: AI Counseling Session
**Objective**: Start and complete an AI counseling session
**Steps**:
1. Navigate to Counseling from dashboard
2. Start new session
3. Complete emotional check-in
4. Chat with AI counselor (5-10 messages)
5. Review coping strategies provided
6. End session and view summary

**Expected Results**:
- AI responds appropriately to emotions
- Coping strategies are relevant
- Session summary captures key points
- No inappropriate or harmful content

**Feedback Questions**:
- Did the AI counselor feel supportive?
- Were the coping strategies helpful?
- Did you feel heard and understood?

---

#### Scenario W3: Emergency SOS Activation
**Objective**: Test emergency response system
**Steps**:
1. Access SOS from any screen
2. Activate SOS button
3. Observe countdown timer
4. Cancel before completion (for safety)
5. Verify alert would reach emergency contacts

**Expected Results**:
- SOS accessible from anywhere
- Clear countdown with cancel option
- Location captured correctly
- Emergency contacts would be notified

**Feedback Questions**:
- Was the SOS button easy to find?
- Did you feel confident help would arrive?
- Is the cancel option clear enough?

---

#### Scenario W4: Evidence Vault Usage
**Objective**: Securely store evidence
**Steps**:
1. Navigate to Evidence Vault
2. Upload a test image
3. Add description and tags
4. View uploaded evidence
5. Test secure sharing (if applicable)

**Expected Results**:
- Upload completes successfully
- Metadata captured (timestamp, location)
- Evidence displayed securely
- Sharing requires confirmation

**Feedback Questions**:
- Did you trust the vault to keep evidence secure?
- Was the upload process straightforward?
- Any concerns about privacy?

---

### 2. Child User Scenarios (Ages 8-17)

⚠️ **Note**: All child testing must be conducted with parental/guardian supervision

#### Scenario C1: Child Registration with Guardian
**Objective**: Complete registration with guardian approval
**Steps**:
1. Guardian initiates child account creation
2. Child enters age-appropriate information
3. Guardian approves and links account
4. Child accesses age-appropriate dashboard

**Expected Results**:
- Age verification works correctly
- Guardian approval required
- Content appropriate for age
- Guardian can monitor activity

**Feedback Questions** (for child):
- Was it easy to set up your account?
- Do you understand what the app does?
- Does the app feel safe to use?

**Feedback Questions** (for guardian):
- Was the approval process clear?
- Do you feel comfortable with the monitoring controls?
- Any concerns about child safety?

---

#### Scenario C2: Learning Module Completion
**Objective**: Complete safety learning story
**Steps**:
1. Navigate to Learning section
2. Select age-appropriate story
3. Complete interactive story with choices
4. Answer quiz questions
5. Earn achievement badge

**Expected Results**:
- Content appropriate for age group
- Choices affect story outcome
- Quiz validates learning
- Achievement system motivating

**Feedback Questions**:
- Was the story interesting?
- Did you learn something new about safety?
- Do you want to complete more stories?

---

#### Scenario C3: Panic Button Test
**Objective**: Test child-friendly emergency features
**Steps**:
1. Locate panic button on dashboard
2. Press and hold (test only)
3. Cancel before activation
4. Verify guardian would be notified

**Expected Results**:
- Panic button prominent and accessible
- Clear visual feedback
- Guardian notification configured
- Age-appropriate messaging

**Feedback Questions**:
- Would you know how to use this in an emergency?
- Is the button easy to find?
- Do you understand what happens when you press it?

---

### 3. Guardian User Scenarios

#### Scenario G1: Guardian Dashboard Overview
**Objective**: Review child's activity and safety status
**Steps**:
1. Log in as guardian
2. Navigate to Guardian Dashboard
3. Review linked child accounts
4. Check recent activity summaries
5. Review any safety alerts

**Expected Results**:
- All linked children visible
- Activity summary clear
- Alerts prominently displayed
- Privacy balance appropriate

**Feedback Questions**:
- Is the dashboard information sufficient?
- Can you quickly identify any concerns?
- Do you feel in control of your child's safety?

---

#### Scenario G2: Receiving Safety Alert
**Objective**: Respond to child safety alert
**Steps**:
1. Trigger test alert (via testing mode)
2. Receive notification
3. View alert details
4. Take appropriate action
5. Mark alert as resolved

**Expected Results**:
- Alert received promptly
- Clear information about concern
- Action options available
- Resolution workflow smooth

**Feedback Questions**:
- Was the alert clear and actionable?
- Did you receive it promptly?
- Were the response options appropriate?

---

## Accessibility Testing Scenarios

### Scenario A1: Screen Reader Navigation
**Objective**: Complete key tasks using only screen reader
**Steps**:
1. Navigate entire app using VoiceOver/NVDA
2. Complete registration
3. Start counseling session
4. Access emergency features

**Expected Results**:
- All elements announced correctly
- Navigation logical and clear
- Form fields properly labeled
- Emergency features accessible

---

### Scenario A2: Keyboard-Only Navigation
**Objective**: Complete key tasks using only keyboard
**Steps**:
1. Tab through all interactive elements
2. Complete form submissions
3. Navigate between pages
4. Activate emergency features

**Expected Results**:
- Visible focus indicators
- Logical tab order
- All actions keyboard accessible
- No keyboard traps

---

## Testing Checklists

### Pre-Testing Checklist
- [ ] Testing environment set up
- [ ] Test accounts created for each user type
- [ ] Consent forms signed (especially for minors)
- [ ] Recording equipment ready (if applicable)
- [ ] Feedback forms prepared
- [ ] Emergency contacts configured with test numbers

### Post-Testing Checklist
- [ ] All feedback collected and organized
- [ ] Issues documented with screenshots/recordings
- [ ] Priority ratings assigned to issues
- [ ] User satisfaction scores calculated
- [ ] Improvement recommendations compiled

---

## Feedback Collection

### Quantitative Metrics
Rate each aspect 1-5:
1. Ease of registration
2. Navigation clarity
3. Feature discoverability
4. Response time/performance
5. Trust in security
6. Overall satisfaction

### Qualitative Questions
1. What was the best part of using SafeHaven?
2. What was the most frustrating experience?
3. What feature would you add?
4. Would you recommend SafeHaven to others?
5. Any safety concerns about the app itself?

---

## Issue Severity Levels

### Critical (P0)
- Security vulnerabilities
- Data loss or corruption
- Emergency features not working
- App crashes

### High (P1)
- Major feature broken
- Confusing user flows
- Accessibility blockers
- Performance issues

### Medium (P2)
- Minor feature issues
- UI inconsistencies
- Edge case failures
- Documentation gaps

### Low (P3)
- Visual polish
- Nice-to-have features
- Minor text changes
- Optimization opportunities

---

## Reporting Template

```markdown
## Issue Report

**Tester**: [Name]
**User Type**: [Woman/Child/Guardian]
**Date**: [Date]
**Device/Browser**: [Details]

### Issue Description
[Clear description of the problem]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Result
[What should happen]

### Actual Result
[What actually happened]

### Severity
[Critical/High/Medium/Low]

### Screenshots/Recordings
[Attach if available]

### Additional Notes
[Any other relevant information]
```

---

## Success Criteria

UAT is successful when:
- [ ] 90%+ of testers complete core workflows
- [ ] No critical (P0) issues remain
- [ ] Average satisfaction score ≥ 4/5
- [ ] All accessibility requirements met
- [ ] Emergency features work 100% reliably
- [ ] Guardian-child linking tested and working
- [ ] AI counseling appropriate for all age groups
