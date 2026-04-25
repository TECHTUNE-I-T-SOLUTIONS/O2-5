# O2-5 Platform - Testing Guide

## Quick Test Checklist

### 1. Database Setup (Already Done ✓)
- [x] Schema initialized with `01-init-schema-v2.sql`
- [ ] Need to sync data with `02-sync-api-football-real.ts`

### 2. Home Page Tests

#### Empty Database State
```bash
# Before syncing data
pnpm dev
# Visit http://localhost:3000
```
Expected:
- Stats section shows all zeros
- Skeleton loaders appear briefly
- "No upcoming matches" empty state
- "No predictions yet" empty state

#### With Data Synced
```bash
# After running sync script
pnpm dev
# Visit http://localhost:3000
```
Expected:
- Stats section shows real numbers
- Upcoming matches display (up to 6)
- Top predictors leaderboard shows (up to 5)
- No loading state after data loads
- Beautiful O2-5 styling with pink accent (#fe00c5)

### 3. Matches Page Tests (`/matches`)

#### Filter Tests
```
Status Filters:
- Click "Scheduled" → Shows NS status fixtures
- Click "Live" → Shows LIVE status fixtures  
- Click "Finished" → Shows FT/AET/PEN status fixtures
```

#### Search Tests
```
Search by:
- Team name (e.g., "Manchester")
- League name (e.g., "Premier")
- Partial matches (e.g., "United")
```

#### Empty State Tests
```
With no data:
- Search returns "No matches found"
- Default state shows "No upcoming matches"
- Empty state includes helpful messaging
```

#### Skeleton Loading Tests
```
Slow network (Chrome DevTools):
1. Open DevTools → Network tab
2. Set throttling to Slow 4G
3. Reload /matches page
4. Should see 6 skeleton loaders before real data
```

### 4. Leaderboard Page Tests (`/leaderboard`)

#### Podium Display
```
With 3+ predictions:
- Top 1st place has 🥇 and larger card with accent gradient
- 2nd place has 🥈
- 3rd place has 🥉
- Each shows: Name, Points, Wins, Accuracy %
```

#### Full Rankings
```
Below podium:
- All players sorted by points descending
- Leaderboard cards show all stats
- Skeleton loaders appear during load
```

#### Empty State
```
With no predictions:
- Shows emoji (📭)
- "No predictions yet" message
- "Be the first to make a prediction..." description
```

### 5. Predictions Page Tests (`/predictions`)

#### Stats Section
```
Display 4 cards:
- Total Predictions (count)
- Correct (count of won=true)
- Accuracy (percentage)
- Total Points (sum)
```

#### Prediction Cards
```
For each prediction:
- Date (formatted)
- Match: "Team A vs Team B"
- Prediction: "Your guess"
- If finished: Final score shown
- Status badge: Correct (green) / Incorrect (red) / Pending (gray)
- Points earned
```

#### Empty State
```
When no predictions:
- Emoji (📭)
- "No predictions yet" message
- Link to /matches page
```

### 6. Dark/Light Mode Tests

#### Theme Detection
```
System Preferences:
- Set OS to Light Mode → Page shows stone colors
- Set OS to Dark Mode → Page shows black background
- Accent color (#fe00c5) appears in both modes
```

#### Manual Theme Check
```
Light Mode Colors:
- Background: #f5f5f4 (stone)
- Text: #1c1917 (dark)
- Accent: #fe00c5 (pink)

Dark Mode Colors:
- Background: #0a0a0a (black)
- Text: #f5f5f4 (light)
- Accent: #fe00c5 (pink)
```

### 7. Responsive Design Tests

#### Breakpoints
```
Mobile (320px):
- Single column layouts
- Touch-friendly buttons
- No horizontal scroll

Tablet (768px):
- Two column grids
- Readable spacing
- Proper padding

Desktop (1024px):
- Three column grids
- Full width utilization
- Maximum content width 7xl
```

#### Test Devices
```bash
# Chrome DevTools
1. Open DevTools (F12)
2. Click device toolbar icon
3. Test on:
   - iPhone 12
   - iPad
   - Desktop 1920x1080
```

## Data Sync Testing

### Before Sync
```bash
# No API calls made
pnpm dev
# All pages show empty states
# Skeleton loaders still work
```

### Running Sync
```bash
# In separate terminal
pnpm tsx scripts/02-sync-api-football-real.ts

# Watch for output:
# ✓ Connected to Supabase
# ✓ Synced X leagues
# ✓ Synced Y teams  
# ✓ Synced Z fixtures
# ✓ Sync complete
```

### After Sync
```bash
# Data now visible
# Kill dev server (Ctrl+C)
pnpm dev
# Refresh pages (Cmd+Shift+R / Ctrl+Shift+R)
# All data should appear
```

## API Error Handling Tests

### Disconnect Database
```bash
1. Go to /api/matches → Should fail gracefully
2. Check browser console → Should log error
3. Pages show empty states (not error pages)
```

### Slow Network
```bash
1. Chrome DevTools → Network tab
2. Slow 4G throttling
3. Pages show skeleton loaders
4. Data loads after several seconds
5. No timeout errors
```

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari
- [ ] Chrome Mobile

## Accessibility Tests

```bash
# Keyboard Navigation
- Tab through all buttons
- Enter/Space activates buttons
- Can tab to and focus search input
- Can filter with keyboard

# Screen Reader (NVDA/VoiceOver)
- Aria labels on icon-only buttons
- Empty states read properly
- Skeleton loaders announced
- Status badges described
```

## Performance Metrics

```
Desired Metrics:
- FCP (First Contentful Paint): < 1s
- LCP (Largest Contentful Paint): < 2.5s
- CLS (Cumulative Layout Shift): < 0.1
- TTI (Time to Interactive): < 3.5s

With skeleton loaders:
- No layout shift when data loads
- Smooth transition from skeleton to real data
```

## Common Issues & Fixes

### Pages Show Empty States
**Problem:** All pages show empty state even after sync
**Solution:** 
1. Check database connection
2. Run sync script again
3. Reload page (Cmd+Shift+R)
4. Check browser console for errors

### Skeleton Loaders Stuck
**Problem:** Skeleton loaders keep animating forever
**Solution:**
1. Check network in DevTools
2. Check API error logs
3. Restart dev server
4. Check database query in terminal

### Dark Mode Not Applying
**Problem:** Pages always show light mode
**Solution:**
1. Check OS theme preference
2. Refresh page after OS theme change
3. Check theme provider in layout.tsx
4. Check globals.css for .dark class

### Wrong Data Displayed
**Problem:** Showing different matches/predictions than expected
**Solution:**
1. Check API status filters (NS, FT, LIVE, etc)
2. Check fixture dates (may be in past)
3. Clear browser cache
4. Restart dev server

## Success Criteria

All tests pass when:
- ✓ Empty states show properly formatted
- ✓ Skeleton loaders animate smoothly
- ✓ Data loads without errors
- ✓ Theme switches automatically
- ✓ Responsive design works
- ✓ No console errors
- ✓ Accessibility good
- ✓ Performance metrics met

## Next Test Phases

After basic tests pass:

### Phase 2: User Interactions
- [ ] Make predictions on matches
- [ ] Verify predictions save to database
- [ ] Check leaderboard updates
- [ ] Test prediction accuracy calculation

### Phase 3: Real-World Scenarios
- [ ] Live match updates
- [ ] Finished match results
- [ ] Multi-day fixture cycles
- [ ] Large leaderboards (100+ users)

### Phase 4: Production Ready
- [ ] Load testing (100+ concurrent)
- [ ] Security testing
- [ ] Database backup/restore
- [ ] Deployment verification
