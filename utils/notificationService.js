import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const CHANNEL_ID = "kenntyfit-reminders";
const CHANNEL_NAME = "KenntyFit reminders";
const CHANNEL_DESCRIPTION = "Meal, water, workout, and step reminders";
const STEP_SUMMARY_NOTIFICATION_ID = "step-summary";
const STEP_SUMMARY_IMMEDIATE_ID = "step-summary-immediate";

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification?.request?.content?.data || {};
    const reminderId = data.reminderId;
    const hour = Number(data.hour);
    const minute = Number(data.minute);
    const title = notification?.request?.content?.title;
    const body = notification?.request?.content?.body;

    if (reminderId && Number.isFinite(hour) && Number.isFinite(minute)) {
      await scheduleReminderNotification({
        id: reminderId,
        title,
        body,
        hour,
        minute,
        repeats: true,
      });
    }

    return {
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

export async function configureReminderChannel() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: CHANNEL_NAME,
    description: CHANNEL_DESCRIPTION,
    importance: 4,
    enableVibrate: true,
    vibrationPattern: [0, 250, 250, 250],
    sound: true,
  });
}

export async function getNotificationPermissionStatus() {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleReminderNotification({ id, title, body, hour, minute, repeats = true }) {
  await configureReminderChannel();

  const identifier = String(id || `reminder-${Date.now()}`);
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => String(item?.content?.data?.reminderId || "") === identifier || String(item?.identifier || "") === identifier)
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier))
  );

  const content = {
    title,
    body,
    sound: true,
    channelId: CHANNEL_ID,
    data: {
      reminderId: identifier,
      hour,
      minute,
    },
  };

  if (hour != null && minute != null) {
    const now = new Date();
    const target = new Date(now);
    target.setHours(hour, minute, 0, 0);

    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    const secondsUntil = Math.max(1, Math.floor((target.getTime() - now.getTime()) / 1000));

    await Notifications.scheduleNotificationAsync({
      identifier,
      content,
      trigger: {
        type: "timeInterval",
        seconds: secondsUntil,
        repeats: false,
      },
    });
  } else {
    await Notifications.scheduleNotificationAsync({
      identifier,
      content,
      trigger: {
        type: "timeInterval",
        seconds: 60 * 60 * 24,
        repeats,
      },
    });
  }

  return identifier;
}

export async function cancelReminderNotifications(reminderId) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const target = String(reminderId || "");

  await Promise.all(
    scheduled
      .filter((item) => {
        const itemReminderId = String(item?.content?.data?.reminderId || "");
        return itemReminderId === target || itemReminderId.startsWith(`${target}_`);
      })
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier))
  );
}

export async function cancelAllScheduledReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleStepSummaryNotification({ steps = 0, calories = 0, intervalSeconds = 60 * 60 * 2 }) {
  const safeSteps = Number(steps || 0);
  if (!Number.isFinite(safeSteps) || safeSteps <= 0) return null;

  await configureReminderChannel();

  const content = {
    title: "Your step summary",
    body: `You’ve walked ${safeSteps} steps today and burned ${calories} kcal.`,
    sound: true,
    channelId: CHANNEL_ID,
    data: { reminderId: STEP_SUMMARY_NOTIFICATION_ID, type: "step-summary" },
  };

  await Promise.all([
    Notifications.cancelScheduledNotificationAsync(STEP_SUMMARY_NOTIFICATION_ID).catch(() => {}),
    Notifications.cancelScheduledNotificationAsync(STEP_SUMMARY_IMMEDIATE_ID).catch(() => {}),
  ]);

  await Notifications.scheduleNotificationAsync({
    identifier: STEP_SUMMARY_IMMEDIATE_ID,
    content,
    trigger: { type: "timeInterval", seconds: 1 },
  });

  await Notifications.scheduleNotificationAsync({
    identifier: STEP_SUMMARY_NOTIFICATION_ID,
    content,
    trigger: {
      type: "timeInterval",
      seconds: intervalSeconds,
      repeats: true,
    },
  });
}

export async function cancelStepSummaryNotifications() {
  await Promise.all([
    Notifications.cancelScheduledNotificationAsync(STEP_SUMMARY_NOTIFICATION_ID).catch(() => {}),
    Notifications.cancelScheduledNotificationAsync(STEP_SUMMARY_IMMEDIATE_ID).catch(() => {}),
  ]);
}

export async function sendTestReminderNotification({ title = "KenntyFit Test", body = "Notifications are working correctly!", seconds = 2 }) {
  await configureReminderChannel();

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      channelId: CHANNEL_ID,
    },
    trigger: {
      type: "timeInterval",
      seconds,
    },
  });
}
