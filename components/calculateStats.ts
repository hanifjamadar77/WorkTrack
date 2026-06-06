export const calculateStats = (
  attendance: any[],
  selectedMonth: number,
  user: any,
) => {
  let days = 0;
  let nights = 0;
  let half = 0;
  let absent = 0;

  const monthlyAttendance = attendance.filter((item: any) => {
    const getMonthFrom = (dateStr: any) => {
      if (!dateStr) return -1;
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d.getMonth();
      } catch (e) {}
      try {
        const parts = (dateStr + "").split("-");
        if (parts.length >= 2) return parseInt(parts[1]) - 1;
      } catch (e) {}
      return -1;
    };

    const monthFromDate = getMonthFrom(item.date);
    return monthFromDate === selectedMonth;
  });

  try {
    console.log(
      "calculateStats: attendance length",
      attendance.length,
      "selectedMonth",
      selectedMonth,
    );
    console.log(
      "calculateStats: sample dates",
      attendance.slice(0, 6).map((i: any) => ({
        date: i.date,
        parsed: (() => {
          try {
            const d = new Date(i.date);
            if (!isNaN(d.getTime())) return d.getMonth();
          } catch (e) {}
          try {
            const parts = (i.date + "").split("-");
            if (parts.length >= 2) return parseInt(parts[1]) - 1;
          } catch (e) {}
          return -1;
        })(),
      })),
    );
    console.log(
      "calculateStats: monthlyAttendance length",
      monthlyAttendance.length,
    );
  } catch (e) {
    // ignore logging errors
  }

  monthlyAttendance.forEach((item: any) => {
    if (item.status === "day") {
      days++;
    }

    if (item.status === "night") {
      nights++;
    }

    // 🔥 Day + Night
    if (item.status === "day_night") {
      days++;
      nights++;
    }

    // 🔥 Half + Night
    if (item.status === "half_night") {
      half++;
      nights++;
    }

    if (item.status === "half") {
      half++;
    }

    if (item.status === "absent") {
      absent++;
    }
  });

  const daySalary = user?.daySalary || 0;
  const nightSalary = user?.nightSalary || 0;
  const halfSalary = user?.halfDaySalary || 0;

  const salary = days * daySalary + nights * nightSalary + half * halfSalary;

  return {
    days,
    nights,
    half,
    absent,
    salary,
  };
};
