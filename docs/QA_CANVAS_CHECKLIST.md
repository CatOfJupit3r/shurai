# Canvas Layout QA Checklist

## Purpose
This document provides a comprehensive manual testing checklist for canvas layout functionality, focusing on persistence, retrieval, and observability features.

## Test Environment Setup
- [ ] MongoDB is running and accessible
- [ ] Server is running on `http://localhost:3000`
- [ ] Web app is running on `http://localhost:3001`
- [ ] Test user accounts are created
- [ ] Test workspaces are created (both public and private)

## 1. Canvas Layout Persistence

### 1.1 Basic Save Operations
- [ ] Create a new workspace
- [ ] Add multiple nodes to the canvas (items, assets)
- [ ] Save the layout
- [ ] Verify the layout is saved successfully (check logs for "Canvas layout saved successfully")
- [ ] Verify revision number increments correctly
- [ ] Reload the page and verify all nodes are still present
- [ ] Verify node positions, sizes, and properties are preserved

### 1.2 Layout Updates
- [ ] Modify existing node positions
- [ ] Add new nodes to existing layout
- [ ] Remove nodes from layout
- [ ] Save the updated layout
- [ ] Verify revision number increments
- [ ] Check logs for payload size and operation duration
- [ ] Reload and verify changes persisted

### 1.3 Content Canvas (Sub-Canvas)
- [ ] Create a content canvas (sub-canvas)
- [ ] Add nodes to the content canvas
- [ ] Reference the content canvas from a parent node
- [ ] Save the layout with embedded content canvas
- [ ] Verify content canvas is saved and retrievable
- [ ] Check that depth validation prevents nested sub-canvases
- [ ] Verify content canvas can be retrieved independently

### 1.4 Layout Reset
- [ ] Save a layout with multiple nodes
- [ ] Reset the layout
- [ ] Verify layout is completely removed
- [ ] Verify content canvases are also removed
- [ ] Check logs for "Canvas layout reset successfully"
- [ ] Try to retrieve the layout (should fail with "Canvas layout not found")

## 2. Canvas Layout Retrieval

### 2.1 Owner Access
- [ ] Owner can retrieve their private workspace layout
- [ ] Owner can retrieve their public workspace layout
- [ ] Check logs for "Canvas layout retrieved successfully"
- [ ] Verify retrieval duration is logged

### 2.2 Public Access
- [ ] Non-owner can retrieve public workspace layout
- [ ] Non-owner cannot retrieve private workspace layout
- [ ] Unauthenticated user can retrieve public layout via slug
- [ ] Check logs for access denial warnings

### 2.3 Error Cases
- [ ] Request layout for non-existent workspace (should return NOT_FOUND)
- [ ] Request layout for workspace without saved layout (should return CANVAS_LAYOUT_NOT_FOUND)
- [ ] Non-owner requests private workspace layout (should return NOT_FOUND to prevent info disclosure)
- [ ] Check logs contain appropriate error context

## 3. Payload Size Validation

### 3.1 Within Limits
- [ ] Create a layout with ~100 nodes
- [ ] Save successfully
- [ ] Verify no warnings in logs
- [ ] Check logs for payload size metrics

### 3.2 Approaching Limits
- [ ] Create a layout with enough nodes to approach 4MB (warning threshold)
- [ ] Save the layout
- [ ] Check logs for "Canvas layout payload approaching size limit" warning
- [ ] Verify percentage used is logged
- [ ] Verify save still succeeds

### 3.3 Exceeding Limits
- [ ] Create a layout with excessive nodes (>5MB)
- [ ] Attempt to save
- [ ] Verify save is rejected with "Canvas layout payload exceeds maximum size limit" error
- [ ] Check logs for error with payload size details
- [ ] Verify error message is actionable for the user

### 3.4 Content Canvas Size
- [ ] Create layout with multiple content canvases
- [ ] Each content canvas has many nodes
- [ ] Verify total payload size is validated correctly
- [ ] Check logs for node and content canvas counts

## 4. Revision Tracking

### 4.1 Sequential Saves
- [ ] Save layout (revision 1)
- [ ] Save layout again (revision 2)
- [ ] Save layout again (revision 3)
- [ ] Verify each save increments revision correctly
- [ ] Check logs show previous and new revision numbers

### 4.2 Reset and Re-save
- [ ] Save layout (revision 1)
- [ ] Reset layout
- [ ] Save new layout (should be revision 1 again)
- [ ] Verify revision counter resets after layout deletion

### 4.3 lastModifiedBy
- [ ] Save layout as user A
- [ ] Verify lastModifiedBy is user A's ID
- [ ] User A saves again
- [ ] Verify lastModifiedBy remains user A's ID

## 5. Logging and Observability

### 5.1 Success Logs
- [ ] Check server logs contain "Canvas layout saved successfully" with:
  - workspaceId
  - userId
  - revision and previousRevision
  - nodesCount
  - contentCanvasesCount
  - payloadSize
  - duration
- [ ] Check logs contain "Canvas layout retrieved successfully" with appropriate metadata
- [ ] Check logs contain "Canvas layout reset successfully"

### 5.2 Warning Logs
- [ ] Verify payload size warnings appear when approaching limits
- [ ] Check warning logs contain percentage used
- [ ] Verify access denial warnings contain userId, workspaceId, visibility

### 5.3 Error Logs
- [ ] Verify error logs appear for payload too large
- [ ] Check error logs for workspace not found
- [ ] Verify error logs contain duration and error context
- [ ] Ensure no sensitive user data is logged

### 5.4 Performance Metrics
- [ ] Verify all operations log duration in milliseconds
- [ ] Check that durations are reasonable (<1000ms for normal operations)
- [ ] Monitor logs during high-load scenarios (if applicable)

## 6. Validation Rules

### 6.1 Depth Limitation
- [ ] Attempt to save layout with SUB_CANVAS node in content canvas
- [ ] Verify save is rejected with "Canvas depth limit exceeded" error
- [ ] Check error message is clear about max depth of 1

### 6.2 Reference Validation
- [ ] Create SUB_CANVAS node referencing non-existent content canvas
- [ ] Attempt to save
- [ ] Verify save is rejected with "invalid item, asset, or sub-canvas reference" error
- [ ] Check logs for validation failure

### 6.3 Node Types
- [ ] Verify ITEM nodes require itemId
- [ ] Verify ASSET nodes can have assetId and assetHints
- [ ] Verify SUB_CANVAS nodes require subCanvasId
- [ ] Test all optional fields (zIndex, rotation, opacity)

## 7. Edge Cases

### 7.1 Empty Layouts
- [ ] Save layout with empty nodes array
- [ ] Verify save succeeds
- [ ] Retrieve and verify nodes array is empty

### 7.2 Optional Fields
- [ ] Save layout with all optional fields populated
- [ ] Verify all fields are preserved (backgroundColor, gridEnabled, gridSize)
- [ ] Save layout with no optional fields
- [ ] Verify save succeeds with minimal data

### 7.3 Concurrent Operations
- [ ] Open workspace in two browser tabs
- [ ] Save from tab 1
- [ ] Save from tab 2
- [ ] Verify both saves succeed and revision increments correctly
- [ ] Check that last save wins (optimistic locking is not implemented)

### 7.4 Deleted Workspace
- [ ] Save layout for workspace
- [ ] Delete the workspace
- [ ] Attempt to retrieve content canvas
- [ ] Verify appropriate error is returned

## 8. Browser Console

### 8.1 Client-Side Errors
- [ ] Open browser developer tools
- [ ] Perform canvas operations
- [ ] Verify no console errors appear during normal operations
- [ ] Check for appropriate error messages when operations fail

### 8.2 Network Requests
- [ ] Monitor network tab during save operations
- [ ] Verify API requests are successful (200 OK)
- [ ] Check request/response payloads are reasonable sizes
- [ ] Verify error responses have appropriate status codes (404, 400, etc.)

## 9. Performance Validation

### 9.1 Save Performance
- [ ] Measure time to save layout with 10 nodes
- [ ] Measure time to save layout with 100 nodes
- [ ] Measure time to save layout with 500 nodes
- [ ] Verify performance degrades gracefully with size
- [ ] Check server logs for duration metrics

### 9.2 Retrieval Performance
- [ ] Measure time to retrieve layout with various sizes
- [ ] Verify retrieval is fast (<500ms for typical layouts)
- [ ] Check logs for retrieval duration

## 10. Documentation

- [ ] Verify error messages are clear and actionable
- [ ] Check that API documentation matches actual behavior
- [ ] Verify contract descriptions are accurate
- [ ] Ensure logging format is consistent

## Post-Testing

### Cleanup
- [ ] Delete test workspaces
- [ ] Remove test content canvases
- [ ] Clear test data from database

### Reporting
- [ ] Document any issues found
- [ ] Note any performance concerns
- [ ] Report any unclear error messages
- [ ] Suggest improvements based on testing

## Notes

### Common Issues to Watch For
- Memory leaks with large payloads
- Slow database queries
- Missing error handling
- Inconsistent logging
- Information disclosure through error messages
- Race conditions in concurrent saves

### Success Criteria
- All tests pass without errors
- Logs contain sufficient context for debugging
- Payload size limits prevent abuse
- Error messages are clear and actionable
- Performance is acceptable for normal use cases
- No sensitive data leaks through logs or errors
