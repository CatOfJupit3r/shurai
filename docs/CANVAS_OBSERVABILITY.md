# Canvas Layout Observability Guide

## Overview
This document describes the logging and observability features implemented for canvas layout operations. These features help monitor, debug, and troubleshoot canvas persistence and retrieval flows.

## Logging Structure

All canvas operations follow a consistent structured logging format with the following principles:

1. **Contextual Information**: Every log includes relevant identifiers (workspaceId, userId, contentCanvasId)
2. **Timing Metrics**: All operations log duration in milliseconds
3. **Operation Metadata**: Node counts, revision numbers, payload sizes where relevant
4. **No Sensitive Data**: User content is never logged, only metadata

## Log Levels

### INFO - Successful Operations
Used for normal, successful operations to track usage patterns and performance.

### WARN - Warnings
Used for conditions that don't prevent operation but may need attention.

### ERROR - Failures
Used when operations fail due to validation, authorization, or unexpected errors.

## Operation-Specific Logs

### 1. Save Layout (`saveLayout`)

#### Success Log
```javascript
console.info('Canvas layout saved successfully', {
  workspaceId: string,
  userId: string,
  revision: number,           // New revision number
  previousRevision: number,   // Previous revision (helpful for detecting conflicts)
  nodesCount: number,         // Count of root-level nodes
  contentCanvasesCount: number, // Count of embedded content canvases
  payloadSize: number,        // Size in bytes of JSON payload
  duration: number            // Time in milliseconds
});
```

**Use cases:**
- Track save frequency per workspace
- Monitor payload sizes over time
- Identify performance bottlenecks
- Analyze revision growth patterns

#### Warning Logs

**Approaching Size Limit:**
```javascript
console.warn('Canvas layout payload approaching size limit', {
  workspaceId: string,
  userId: string,
  payloadSize: number,        // Current size in bytes
  maxSize: number,            // Maximum allowed (5MB)
  threshold: number,          // Warning threshold (4MB)
  percentageUsed: string,     // e.g., "85.23"
  nodesCount: number,
  contentCanvasesCount: number
});
```

**Triggered when:** Payload exceeds 4MB but is under 5MB limit

**Action:** Monitor these workspaces, may need optimization or user guidance

**Access Denied:**
```javascript
console.warn('Canvas layout save failed - workspace not found or access denied', {
  workspaceId: string,
  userId: string,
  found: boolean,             // Was workspace found?
  isOwner: boolean,           // Does user own workspace?
  duration: number
});
```

#### Error Logs

**Payload Too Large:**
```javascript
console.error('Canvas layout payload too large', {
  workspaceId: string,
  userId: string,
  payloadSize: number,
  maxSize: number,
  nodesCount: number,
  contentCanvasesCount: number
});
```

**Triggered when:** Payload exceeds 5MB hard limit

**Action:** User needs to reduce layout complexity or split into multiple layouts

**Unexpected Error:**
```javascript
console.error('Canvas layout save failed - unexpected error', {
  workspaceId: string,
  userId: string,
  error: string,              // Error message
  duration: number
});
```

### 2. Get Layout (`getLayout`)

#### Success Log
```javascript
console.info('Canvas layout retrieved successfully', {
  workspaceId: string,
  userId: string,
  revision: number,
  nodesCount: number,
  contentCanvasesCount: number,
  duration: number
});
```

**Use cases:**
- Track retrieval patterns
- Monitor read performance
- Correlate with save operations

#### Warning Logs

**Workspace Not Found:**
```javascript
console.warn('Canvas layout retrieval failed - workspace not found', {
  workspaceId: string,
  userId: string,
  duration: number
});
```

**Access Denied:**
```javascript
console.warn('Canvas layout retrieval failed - access denied', {
  workspaceId: string,
  userId: string,
  ownerId: string,
  visibility: string,         // 'PUBLIC' or 'PRIVATE'
  duration: number
});
```

**Layout Not Found:**
```javascript
console.warn('Canvas layout retrieval failed - layout not found', {
  workspaceId: string,
  userId: string,
  duration: number
});
```

### 3. Reset Layout (`resetLayout`)

#### Success Log
```javascript
console.info('Canvas layout reset successfully', {
  workspaceId: string,
  userId: string,
  duration: number
});
```

#### Warning Logs

**Access Denied:**
```javascript
console.warn('Canvas layout reset failed - workspace not found or access denied', {
  workspaceId: string,
  userId: string,
  found: boolean,
  isOwner: boolean,
  duration: number
});
```

### 4. Get Public Layout (`getPublicLayout`)

#### Success Log
```javascript
console.info('Public canvas layout retrieved successfully', {
  slug: string,
  workspaceId: string,
  revision: number,
  nodesCount: number,
  contentCanvasesCount: number,
  duration: number
});
```

**Note:** No userId since this is a public endpoint

#### Warning Logs

**Workspace Not Found:**
```javascript
console.warn('Public canvas layout retrieval failed - workspace not found', {
  slug: string,
  duration: number
});
```

### 5. Get Content Canvas (`getContentCanvas`)

#### Success Log
```javascript
console.info('Content canvas retrieved successfully', {
  contentCanvasId: string,
  workspaceId: string,
  userId: string,
  nodesCount: number,
  duration: number
});
```

#### Warning Logs

**Not Found:**
```javascript
console.warn('Content canvas retrieval failed - not found', {
  contentCanvasId: string,
  userId: string,
  duration: number
});
```

**Parent Workspace Not Found:**
```javascript
console.warn('Content canvas retrieval failed - parent workspace not found', {
  contentCanvasId: string,
  workspaceId: string,
  userId: string,
  duration: number
});
```

**Access Denied:**
```javascript
console.warn('Content canvas retrieval failed - access denied', {
  contentCanvasId: string,
  workspaceId: string,
  userId: string,
  ownerId: string,
  visibility: string,
  duration: number
});
```

## Payload Size Limits

### Configuration
- **Maximum Size**: 5,242,880 bytes (5MB)
- **Warning Threshold**: 4,194,304 bytes (4MB, 80% of max)

### Monitoring Payload Sizes

Query logs for patterns:
```bash
# Find all saves approaching limit
grep "approaching size limit" server.log

# Find all rejected payloads
grep "payload too large" server.log

# Analyze payload size distribution
grep "Canvas layout saved successfully" server.log | jq '.payloadSize' | sort -n
```

### Payload Size Breakdown
A typical payload includes:
- Node metadata (id, type, position, size): ~150-200 bytes per node
- Asset hints (if present): ~50 bytes per node
- Content canvas metadata: ~200 bytes base + nodes
- Canvas configuration: ~100 bytes

**Example:**
- 100 nodes with basic info: ~20KB
- 1000 nodes with full hints: ~250KB
- 10 content canvases with 50 nodes each: ~100KB + 1MB = ~1.1MB

## Performance Metrics

### Duration Tracking
All operations measure time from start to completion, including:
- Database queries
- Validation logic
- Data transformation

### Expected Performance
- **Save**: 50-200ms for normal layouts, up to 500ms for very large ones
- **Retrieve**: 50-150ms for normal layouts
- **Reset**: 30-100ms

### Alerting Thresholds
Consider alerts for:
- Save operations taking >1000ms
- Retrieve operations taking >500ms
- Payloads consistently approaching size limits
- High frequency of access denied warnings (potential attack)

## Monitoring Queries

### Most Active Workspaces
```bash
grep "Canvas layout saved successfully" server.log | \
  jq -r '.workspaceId' | \
  sort | uniq -c | sort -nr | head -10
```

### Average Save Duration
```bash
grep "Canvas layout saved successfully" server.log | \
  jq -r '.duration' | \
  awk '{sum+=$1; count++} END {print sum/count}'
```

### Payload Size Distribution
```bash
grep "Canvas layout saved successfully" server.log | \
  jq -r '.payloadSize' | \
  awk '{
    if ($1 < 100000) small++
    else if ($1 < 1000000) medium++
    else if ($1 < 4000000) large++
    else xlarge++
  }
  END {
    print "Small (<100KB):", small
    print "Medium (100KB-1MB):", medium
    print "Large (1MB-4MB):", large
    print "Very Large (>4MB):", xlarge
  }'
```

### Failed Operations
```bash
# Access denied attempts
grep "access denied" server.log | jq -r '[.workspaceId, .userId] | @csv'

# Not found errors
grep "not found" server.log | jq -r '[.workspaceId, .userId] | @csv'
```

## Debugging Common Issues

### Issue: Save Takes Too Long
1. Check log for duration > 500ms
2. Analyze payload size - may be too large
3. Check node count - extremely high counts (>5000) may cause slowness
4. Review database performance - indexes may need optimization

### Issue: Frequent Access Denied
1. Check logs for patterns in userId/workspaceId
2. May indicate:
   - User error (trying to modify wrong workspace)
   - Potential security probing
   - UI bug showing inaccessible workspaces

### Issue: Payload Approaching Limit
1. Review node count in warning logs
2. Suggest to user:
   - Reduce number of nodes
   - Split into multiple layouts
   - Remove unnecessary asset hints
   - Simplify content canvases

### Issue: High Revision Numbers
1. Check revision numbers in save logs
2. High numbers (>1000) may indicate:
   - Auto-save too aggressive
   - User making many small changes
   - Consider implementing revision compaction

## Privacy and Security

### What We Log
- Operation metadata (counts, sizes, durations)
- User and resource identifiers
- Error messages and validation failures
- Performance metrics

### What We Don't Log
- Node content (item names, descriptions)
- Asset URLs or file paths
- Canvas design details beyond counts
- User-generated text content

### Log Retention
- Logs should be retained based on organizational policy
- Consider anonymizing old logs
- Ensure compliance with privacy regulations

## Integration with Monitoring Systems

### Structured Logging Benefits
All logs are structured JSON, making them ideal for:
- **Elasticsearch/Kibana**: Full-text search and visualization
- **Datadog/New Relic**: APM integration and alerting
- **CloudWatch/Stackdriver**: Cloud-native monitoring
- **Custom Dashboards**: Parse and visualize with any tool

### Recommended Dashboards
1. **Operations Overview**: Save/retrieve counts, success rates
2. **Performance Monitoring**: Duration percentiles, slow queries
3. **Payload Analytics**: Size distribution, approaching-limit trends
4. **Error Tracking**: Failed operations by type and workspace
5. **User Activity**: Most active users/workspaces

## Future Enhancements

Consider adding:
- [ ] Correlation IDs for request tracing
- [ ] Aggregated metrics endpoints
- [ ] Real-time dashboard for operations team
- [ ] Automated alerts for anomalies
- [ ] A/B test tracking for canvas features
- [ ] User session tracking across operations
