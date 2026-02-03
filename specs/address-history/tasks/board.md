# Address History - Task Board

**Quick Reference for Worker Agents**

---

## 🎯 Ready to Start (No Dependencies)

| Task ID | Title | Complexity | Est. Time | Agent |
|---------|-------|------------|-----------|-------|
| TASK-01 | Define AddressEntry Type | 🟢 Low | 15 min | Any |
| TASK-05 | Create Date Utility Functions | 🟢 Low | 20 min | Any |

---

## ⏳ Waiting for Dependencies

### After TASK-01 Completes:
| Task ID | Title | Complexity | Est. Time | Blocks |
|---------|-------|------------|-----------|--------|
| TASK-02 | Create Address Storage Functions | 🟢 Low | 30 min | Phase 2 |

### After TASK-01 + TASK-05 Complete:
| Task ID | Title | Complexity | Est. Time | Can Run Parallel |
|---------|-------|------------|-----------|-----------------|
| TASK-03 | Create Validation Utility Functions | 🟡 Medium | 45 min | ✅ With TASK-04 |
| TASK-04 | Create Gap Detection Function | 🟡 Medium | 30 min | ✅ With TASK-03 |

### After TASK-02 + TASK-06 Complete:
| Task ID | Title | Complexity | Est. Time | Can Run Parallel |
|---------|-------|------------|-----------|-----------------|
| TASK-07 | Create Address Form Component | 🟡 Medium | 1 hour | - |
| TASK-08 | Create Address Card Component | 🟡 Medium | 45 min | ✅ With TASK-10 |
| TASK-10 | Create Current Address Form | 🟢 Low | 20 min | ✅ With TASK-08 |

### After TASK-07 + TASK-04 Complete:
| Task ID | Title | Complexity | Est. Time | - |
|---------|-------|------------|-----------|---|
| TASK-11 | Create Previous Address Form | 🟡 Medium | 45 min | - |
| TASK-12 | Create Gap Explanation Dialog | 🟡 Medium | 30 min | - |

### After Phase 3 Complete:
| Task ID | Title | Complexity | Est. Time | Can Run Parallel |
|---------|-------|------------|-----------|-----------------|
| TASK-13 | Create Main Address History Component | 🔴 High | 2 hours | - |
| TASK-14 | Create Address List Display | 🟢 Low | 20 min | Part of TASK-13 |
| TASK-15 | Implement Add Previous Address Flow | 🟡 Medium | 45 min | Part of TASK-13 |

### After TASK-13 Complete:
| Task ID | Title | Complexity | Est. Time | Can Run Parallel |
|---------|-------|------------|-----------|-----------------|
| TASK-16 | Integrate with StepShell | 🟢 Low | 15 min | - |
| TASK-17 | Implement Responsive Design | 🟡 Medium | 1 hour | ✅ With TASK-18 |
| TASK-18 | Accessibility & Visual Polish | 🟡 Medium | 1 hour | ✅ With TASK-17 |

---

## 📋 Task Details Quick Lookup

See `address-history-tasks.md` for full details on each task.

### Quick Task Summary:

**TASK-01**: Update `AddressEntry` type in `intakeStorage.ts` to match spec  
**TASK-02**: Add save/load/update/remove functions for addresses  
**TASK-03**: Create validation functions (required fields, dates, overlaps)  
**TASK-04**: Implement gap detection algorithm (>30 days)  
**TASK-05**: Date formatting and comparison utilities  
**TASK-06**: React hook for form validation  
**TASK-07**: Base address form component (all fields)  
**TASK-08**: Address card display component  
**TASK-09**: Edit/remove address actions  
**TASK-10**: Current address form wrapper  
**TASK-11**: Previous address form wrapper  
**TASK-12**: Gap explanation dialog  
**TASK-13**: Main orchestrator component  
**TASK-14**: Address list display  
**TASK-15**: Add previous address flow  
**TASK-16**: StepShell integration  
**TASK-17**: Responsive design  
**TASK-18**: Accessibility & polish  

---

## 🚀 How to Pick Up a Task

1. Check this board for tasks marked "Ready to Start" or check dependencies
2. Read full task details in `address-history-tasks.md`
3. Update task status: `⏳ Pending` → `🔄 In Progress`
4. Implement according to acceptance criteria
5. Test using provided test commands
6. Update status: `🔄 In Progress` → `✅ Complete`
7. Move to next available task

---

## 📊 Progress Overview

**Total Tasks**: 18  
**Completed**: 0  
**In Progress**: 0  
**Pending**: 18  
**Blocked**: 0

---

## 🔗 Related Files

- **Full Spec**: `../example-address-history.md`
- **Development Guide**: `../../SPEC_DRIVEN_DEVELOPMENT.md`
- **Existing Patterns**: 
  - `apps/web/src/app/components/intake/IntakeFlow.tsx`
  - `apps/web/src/app/components/intake/StepShell.tsx`
  - `apps/web/src/app/lib/intakeStorage.ts`
