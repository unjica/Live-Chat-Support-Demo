/**
 * UI copy and shared demo defaults for visitor widget, admin dashboard, and Socket.IO payloads.
 *
 * `demoAdminUserId` is the stable `User.id` / `senderId` / typing-map key for the built-in agent.
 * It must stay aligned with the admin `setUser` payload — do not confuse with `UserRole.ADMIN`
 * (same string today, but role enums are not user identities).
 */
export const chatConfig = {
  welcomeMessage: 'Hi 👋 How can we help you?',
  defaultAgentName: 'Support Team',
  demoAdminUserId: 'admin',
}; 