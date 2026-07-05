import BaseModel from "./BaseModel.js";

export default class Event extends BaseModel {
  constructor(data) {
    super(data);
    this.title = data.title;
    this.category = data.category;
    this.location = data.location;
    this.date = data.date;
    this.time = data.time;
    this.price = Number(data.price);
    this.quota = Number(data.quota);
    this.sold = Number(data.sold || 0);
    this.description = data.description;
    this.status = data.status || "draft";
  }

  getRemainingQuota() {
    return Math.max(0, this.quota - this.sold);
  }

  getRevenue() {
    return this.sold * this.price;
  }

  getDemandLevel() {
    const percentage = (this.sold / this.quota) * 100;

    if (percentage >= 80) return "High";
    if (percentage >= 50) return "Medium";
    return "Low";
  }

  toJSON() {
    return {
      ...super.toJSON(),
      title: this.title,
      category: this.category,
      location: this.location,
      date: this.date,
      time: this.time,
      price: this.price,
      quota: this.quota,
      sold: this.sold,
      remainingQuota: this.getRemainingQuota(),
      revenue: this.getRevenue(),
      demandLevel: this.getDemandLevel(),
      description: this.description,
      status: this.status
    };
  }
}
