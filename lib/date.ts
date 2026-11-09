const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Shanghai",
});

export function formatDateTime(value: Date) {
  return DATE_TIME_FORMATTER.format(value);
}
