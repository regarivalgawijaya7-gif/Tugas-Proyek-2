import User from "./User.js";

export default class AdminUser extends User {
  constructor(data) {
    super({
      ...data,
      role: "admin"
    });
  }

  canAccessAnalytics() {
    return true;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      canAccessAnalytics: this.canAccessAnalytics()
    };
  }
}
