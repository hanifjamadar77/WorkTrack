export const calculateStats = (
  attendance: any[],
  selectedMonth: number,
  user: any
) => {
  let days = 0;
  let nights = 0;
  let half = 0;
  let absent = 0;

  const monthlyAttendance = attendance.filter((item: any) => {
    const monthFromDate = parseInt(item.date.split("-")[1]) - 1;
    return monthFromDate === selectedMonth;
  });

  monthlyAttendance.forEach((item: any) => {
    if (item.status === "day") days++;
    if (item.status === "night") nights++;
    if (item.status === "day_night") {
      days++;
      nights++;
    }
    if (item.status === "half") half++;
    if (item.status === "absent") absent++;
  });

  const daySalary = user?.daySalary || 0;
  const nightSalary = user?.nightSalary || 0;
  const halfSalary = user?.halfDaySalary || 0;

  const salary =
    days * daySalary +
    nights * nightSalary +
    half * halfSalary;

  return {
    days,
    nights,
    half,
    absent,
    salary,
  };
};