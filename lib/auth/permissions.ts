/**
 * 统一权限目录。
 *
 * 权限编码采用「资源.动作」格式，复合资源使用驼峰命名。
 * 权限目录由 TypeScript 维护，数据库只保存角色授权结果（RolePermission）。
 */
export type PermissionDomain = "SYSTEM" | "BUSINESS";

export type PermissionDefinitionBase = {
  resource: string;
  action: string;
  name: string;
  module: string;

  domain: PermissionDomain;

  // 是否允许通过 RolePermission 授权
  grantable: boolean;

  // 是否支持数据范围
  scopeable: boolean;
};

const PERMISSION_BASE = {
  // =========================
  // 系统入口
  // =========================

  "portal.admin": {
    resource: "portal",
    action: "admin",
    name: "统一后台入口",
    module: "系统入口",
    domain: "BUSINESS",
    grantable: true,
    scopeable: false,
  },

  "portal.parent": {
    resource: "portal",
    action: "parent",
    name: "家长端入口",
    module: "系统入口",
    domain: "BUSINESS",
    grantable: true,
    scopeable: false,
  },

  // =========================
  // 用户管理
  // =========================

  "user.view": {
    resource: "user",
    action: "view",
    name: "查看用户",
    module: "用户管理",
    domain: "SYSTEM",
    grantable: false,
    scopeable: false,
  },

  "user.create": {
    resource: "user",
    action: "create",
    name: "创建用户",
    module: "用户管理",
    domain: "SYSTEM",
    grantable: false,
    scopeable: false,
  },

  "user.edit": {
    resource: "user",
    action: "edit",
    name: "编辑用户",
    module: "用户管理",
    domain: "SYSTEM",
    grantable: false,
    scopeable: false,
  },

  "user.delete": {
    resource: "user",
    action: "delete",
    name: "删除用户",
    module: "用户管理",
    domain: "SYSTEM",
    grantable: false,
    scopeable: false,
  },

  "user.resetPassword": {
    resource: "user",
    action: "resetPassword",
    name: "重置密码",
    module: "用户管理",
    domain: "SYSTEM",
    grantable: false,
    scopeable: false,
  },

  "user.disable": {
    resource: "user",
    action: "disable",
    name: "启用或禁用用户",
    module: "用户管理",
    domain: "SYSTEM",
    grantable: false,
    scopeable: false,
  },

  "user.assignRole": {
    resource: "user",
    action: "assignRole",
    name: "为用户分配角色",
    module: "用户管理",
    domain: "SYSTEM",
    grantable: false,
    scopeable: false,
  },

  // =========================
  // 角色管理
  // =========================

  "role.view": {
    resource: "role",
    action: "view",
    name: "查看角色",
    module: "角色管理",
    domain: "SYSTEM",
    grantable: false,
    scopeable: false,
  },

  "role.create": {
    resource: "role",
    action: "create",
    name: "创建角色",
    module: "角色管理",
    domain: "SYSTEM",
    grantable: false,
    scopeable: false,
  },

  "role.edit": {
    resource: "role",
    action: "edit",
    name: "编辑角色",
    module: "角色管理",
    domain: "SYSTEM",
    grantable: false,
    scopeable: false,
  },

  "role.delete": {
    resource: "role",
    action: "delete",
    name: "删除角色",
    module: "角色管理",
    domain: "SYSTEM",
    grantable: false,
    scopeable: false,
  },

  "role.disable": {
    resource: "role",
    action: "disable",
    name: "启用或禁用角色",
    module: "角色管理",
    domain: "SYSTEM",
    grantable: false,
    scopeable: false,
  },

  "role.assignUser": {
    resource: "role",
    action: "assignUser",
    name: "管理角色成员",
    module: "角色管理",
    domain: "SYSTEM",
    grantable: false,
    scopeable: false,
  },

  "role.assignPermissions": {
    resource: "role",
    action: "assignPermissions",
    name: "分配角色权限",
    module: "角色管理",
    domain: "SYSTEM",
    grantable: false,
    scopeable: false,
  },

  "permission.view": {
    resource: "permission",
    action: "view",
    name: "查看权限目录",
    module: "权限管理",
    domain: "SYSTEM",
    grantable: false,
    scopeable: false,
  },

  // =========================
  // 经营管理
  // =========================

  "dashboard.view": {
    resource: "dashboard",
    action: "view",
    name: "查看经营仪表盘",
    module: "经营管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: false,
  },

  // =========================
  // 线索与招生
  // =========================

  "lead.view": {
    resource: "lead",
    action: "view",
    name: "查看线索",
    module: "招生管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },

  "lead.create": {
    resource: "lead",
    action: "create",
    name: "创建线索",
    module: "招生管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: false,
  },

  "lead.edit": {
    resource: "lead",
    action: "edit",
    name: "编辑线索",
    module: "招生管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },

  "leadFollowUp.view": {
    resource: "leadFollowUp",
    action: "view",
    name: "查看跟进记录",
    module: "招生管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },

  "leadFollowUp.create": {
    resource: "leadFollowUp",
    action: "create",
    name: "创建跟进记录",
    module: "招生管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: false,
  },

  "enrollment.view": {
    resource: "enrollment",
    action: "view",
    name: "查看报名",
    module: "招生管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },

  "enrollment.create": {
    resource: "enrollment",
    action: "create",
    name: "创建报名",
    module: "招生管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: false,
  },

  "enrollment.close": {
    resource: "enrollment",
    action: "close",
    name: "完成报名转化",
    module: "招生管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },

  // =========================
  // 订单与支付
  // =========================

  "order.view": {
    resource: "order",
    action: "view",
    name: "查看订单",
    module: "订单管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },

  "order.create": {
    resource: "order",
    action: "create",
    name: "创建订单",
    module: "订单管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: false,
  },

  "order.edit": {
    resource: "order",
    action: "edit",
    name: "编辑订单",
    module: "订单管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },

  "payment.view": {
    resource: "payment",
    action: "view",
    name: "查看收款记录",
    module: "财务管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },

  // =========================
  // 学生管理
  // =========================

  "student.view": {
    resource: "student",
    action: "view",
    name: "查看学生",
    module: "学生管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },

  "student.create": {
    resource: "student",
    action: "create",
    name: "创建学生",
    module: "学生管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: false,
  },

  "student.edit": {
    resource: "student",
    action: "edit",
    name: "编辑学生",
    module: "学生管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },

  "student.disable": {
    resource: "student",
    action: "disable",
    name: "启用或禁用学生",
    module: "学生管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },

  "student.useForSchedule": {
    resource: "student",
    action: "useForSchedule",
    name: "将学生用于排课",
    module: "排课管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },

  "student.useForEnrollment": {
    resource: "student",
    action: "useForEnrollment",
    name: "将学生用于报名",
    module: "招生管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },

  "student.useForOrder": {
    resource: "student",
    action: "useForOrder",
    name: "将学生用于订单",
    module: "订单管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },

  "student.useForVocabularyRequest": {
    resource: "student",
    action: "useForVocabularyRequest",
    name: "将学生用于词汇申请",
    module: "词汇管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },

  "student.useForLessonLedger": {
    resource: "student",
    action: "useForLessonLedger",
    name: "将学生用于课时账本",
    module: "课时管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },

  // =========================
  // 课程管理
  // =========================

  "course.view": {
    resource: "course",
    action: "view",
    name: "查看课程",
    module: "课程管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },

  "course.create": {
    resource: "course",
    action: "create",
    name: "创建课程",
    module: "课程管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: false,
  },

  "course.edit": {
    resource: "course",
    action: "edit",
    name: "编辑课程",
    module: "课程管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },

  "course.useForSchedule": {
    resource: "course",
    action: "useForSchedule",
    name: "将课程用于排课",
    module: "排课管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },

  // =========================
  // 排课管理
  // =========================

  "schedule.view": {
    resource: "schedule",
    action: "view",
    name: "查看排课",
    module: "排课管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },

  "schedule.create": {
    resource: "schedule",
    action: "create",
    name: "创建排课",
    module: "排课管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: false,
  },

  "schedule.edit": {
    resource: "schedule",
    action: "edit",
    name: "修改排课",
    module: "排课管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },

  "schedule.useForTeachingRecord": {
    resource: "schedule",
    action: "useForTeachingRecord",
    name: "将排课用于教学记录",
    module: "教学管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },

  // =========================
  // 教学记录
  // =========================

  "teachingRecord.view": {
    resource: "teachingRecord",
    action: "view",
    name: "查看教学记录",
    module: "教学管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },

  "teachingRecord.create": {
    resource: "teachingRecord",
    action: "create",
    name: "创建教学记录",
    module: "教学管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: false,
  },

  // =========================
  // 词汇管理
  // =========================

  "vocabularyRequest.view": {
    resource: "vocabularyRequest",
    action: "view",
    name: "查看词汇申请",
    module: "词汇管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },

  "vocabularyRequest.create": {
    resource: "vocabularyRequest",
    action: "create",
    name: "创建词汇申请",
    module: "词汇管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: false,
  },

  // =========================
  // 课时管理
  // =========================

  "lessonLedger.view": {
    resource: "lessonLedger",
    action: "view",
    name: "查看课时账本",
    module: "课时管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },

  "lessonLedger.create": {
    resource: "lessonLedger",
    action: "create",
    name: "创建课时流水",
    module: "课时管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: false,
  },

  // =========================
  // 教师管理
  // =========================

  "teacherAssignment.view": {
    resource: "teacherAssignment",
    action: "view",
    name: "查看教师任务",
    module: "教师管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },

  "teacherAssignment.accept": {
    resource: "teacherAssignment",
    action: "accept",
    name: "接受教学任务",
    module: "教师管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },

  "teacherSettlement.view": {
    resource: "teacherSettlement",
    action: "view",
    name: "查看教师结算",
    module: "财务管理",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },

  // =========================
  // 家长报告
  // =========================

  "parentReport.view": {
    resource: "parentReport",
    action: "view",
    name: "查看家长报告",
    module: "家长服务",
    domain: "BUSINESS",
    grantable: true,
    scopeable: true,
  },
} satisfies Record<string, PermissionDefinitionBase>;

/**
 * 权限编码由权限目录的键推导，写错编码时 TypeScript 直接报错。
 */
export type PermissionCode = keyof typeof PERMISSION_BASE;

export type PermissionDefinition = PermissionDefinitionBase & {
  createScopes?: {
    permission: PermissionCode;
    relation: string;
  }[];
};

/**
 * 完整权限定义：在基础定义上补充创建业务数据时的关联资源校验配置。
 *
 * relation 表示创建数据时，输入对象中对应的外键字段。
 */
export const PERMISSIONS: Record<PermissionCode, PermissionDefinition> = {
  ...PERMISSION_BASE,

  "schedule.create": {
    ...PERMISSION_BASE["schedule.create"],
    createScopes: [
      {
        permission: "student.useForSchedule",
        relation: "studentId",
      },
      {
        permission: "course.useForSchedule",
        relation: "courseId",
      },
    ],
  },

  "teachingRecord.create": {
    ...PERMISSION_BASE["teachingRecord.create"],
    createScopes: [
      {
        permission: "schedule.useForTeachingRecord",
        relation: "scheduleId",
      },
    ],
  },

  "vocabularyRequest.create": {
    ...PERMISSION_BASE["vocabularyRequest.create"],
    createScopes: [
      {
        permission: "student.useForVocabularyRequest",
        relation: "studentId",
      },
    ],
  },

  "lessonLedger.create": {
    ...PERMISSION_BASE["lessonLedger.create"],
    createScopes: [
      {
        permission: "student.useForLessonLedger",
        relation: "studentId",
      },
    ],
  },

  "order.create": {
    ...PERMISSION_BASE["order.create"],
    createScopes: [
      {
        permission: "student.useForOrder",
        relation: "studentId",
      },
    ],
  },

  "enrollment.create": {
    ...PERMISSION_BASE["enrollment.create"],
    createScopes: [
      {
        permission: "student.useForEnrollment",
        relation: "studentId",
      },
    ],
  },

  "leadFollowUp.create": {
    ...PERMISSION_BASE["leadFollowUp.create"],
    createScopes: [
      {
        permission: "lead.view",
        relation: "leadId",
      },
    ],
  },
};

/**
 * 系统保留角色，不允许通过普通角色管理功能删除或修改角色编码。
 */
export const SYSTEM_ROLE_CODES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
} as const;
