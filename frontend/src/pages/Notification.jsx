import React, { useState } from "react";
import styles from "../css/Notification.module.css";

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      name: "John Doe",
      unreadCount: 3,
      lastMessage:
        "Hello, I need information about your services. Could you please provide more details about your pricing plans and what's included in each package?",
      timestamp: "2 min ago",
      avatar: "JD",
      isOnline: true,
    },
    {
      id: 2,
      name: "Sarah Johnson",
      unreadCount: 1,
      lastMessage:
        "Thank you for the quick response! I really appreciate your help with setting up the account.",
      timestamp: "5 min ago",
      avatar: "SJ",
      isOnline: false,
    },
    {
      id: 3,
      name: "Mike Wilson",
      unreadCount: 7,
      lastMessage:
        "Can we schedule a meeting for next week? I'd like to discuss the project requirements in detail and go over the timeline.",
      timestamp: "1 hour ago",
      avatar: "MW",
      isOnline: true,
    },
    {
      id: 4,
      name: "Emma Davis",
      unreadCount: 2,
      lastMessage:
        "I have some questions about pricing and would like to know more about the enterprise features you offer.",
      timestamp: "3 hours ago",
      avatar: "ED",
      isOnline: false,
    },
    {
      id: 5,
      name: "Alex Thompson",
      unreadCount: 0,
      lastMessage:
        "Perfect! The integration is working smoothly now. Thanks for all your help throughout the process.",
      timestamp: "5 hours ago",
      avatar: "AT",
      isOnline: true,
    },
    {
      id: 6,
      name: "Lisa Chen",
      unreadCount: 4,
      lastMessage:
        "Could you please send me the documentation for the API? I need to review it before our meeting tomorrow.",
      timestamp: "1 day ago",
      avatar: "LC",
      isOnline: false,
    },
  ]);

  const [filter, setFilter] = useState("all"); // 'all', 'unread', 'read'

  const handleNotificationClick = (id) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, unreadCount: 0 } : notif
      )
    );
  };

  const totalUnread = notifications.reduce(
    (sum, notif) => sum + notif.unreadCount,
    0
  );

  const clearAllNotifications = () => {
    setNotifications(
      notifications.map((notif) => ({ ...notif, unreadCount: 0 }))
    );
  };

  const getAvatarColor = (name) => {
    const colors = [
      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread") return notification.unreadCount > 0;
    if (filter === "read") return notification.unreadCount === 0;
    return true; // 'all'
  });

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.titleIcon}>💬</span>
          Messages
        </h1>
        <div className={styles.headerActions}>
          {totalUnread > 0 && (
            <div className={styles.unreadCounter}>
              <span>📬</span>
              {totalUnread} unread
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={styles.filterTabs}>
        <button
          className={`${styles.filterTab} ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All Messages ({notifications.length})
        </button>
        <button
          className={`${styles.filterTab} ${
            filter === "unread" ? "active" : ""
          }`}
          onClick={() => setFilter("unread")}
        >
          Unread ({notifications.filter((n) => n.unreadCount > 0).length})
        </button>
        <button
          className={`${styles.filterTab} ${filter === "read" ? "active" : ""}`}
          onClick={() => setFilter("read")}
        >
          Read ({notifications.filter((n) => n.unreadCount === 0).length})
        </button>
      </div>

      {/* Notifications List */}
      <div className={styles.notificationsList}>
        {filteredNotifications.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              {filter === "unread" ? "📭" : filter === "read" ? "✅" : "💬"}
            </div>
            <h3 className={styles.emptyTitle}>
              {filter === "unread"
                ? "No unread messages"
                : filter === "read"
                ? "No read messages"
                : "No messages yet"}
            </h3>
            <p className={styles.emptyText}>
              {filter === "unread"
                ? "All caught up! You have no unread messages."
                : filter === "read"
                ? "No messages have been read yet."
                : "Your messages will appear here when you receive them."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`${styles.notificationItem} ${
                notification.unreadCount > 0 ? styles.unreadItem : ""
              }`}
              onClick={() => handleNotificationClick(notification.id)}
            >
              <div className={styles.avatarContainer}>
                <div
                  className={styles.avatar}
                  style={{
                    background: getAvatarColor(notification.name),
                  }}
                >
                  {notification.avatar}
                </div>
                {notification.isOnline && (
                  <div className={styles.onlineIndicator}></div>
                )}
              </div>

              <div className={styles.notificationContent}>
                <div className={styles.notificationHeader}>
                  <h4 className={styles.personName}>{notification.name}</h4>
                  <span className={styles.timestamp}>
                    {notification.timestamp}
                  </span>
                </div>
                <p className={styles.lastMessage}>{notification.lastMessage}</p>

                <div className={styles.notificationMeta}>
                  {notification.unreadCount > 0 && (
                    <div className={styles.unreadBadge}>
                      {notification.unreadCount > 99
                        ? "99+"
                        : notification.unreadCount}
                    </div>
                  )}
                  <div className={styles.actionButtons}>
                    <button className={styles.actionButton}>Reply</button>
                    <button className={styles.actionButton}>Archive</button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More Button (for pagination) */}
      {filteredNotifications.length > 0 && (
        <button className={styles.loadMoreButton}>Load More Messages</button>
      )}
    </div>
  );
};

export default NotificationPage;
