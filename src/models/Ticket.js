import BaseModel from "./BaseModel.js";

export default class Ticket extends BaseModel {
  constructor(data) {
    super(data);
    this.eventId = data.eventId;
    this.userId = data.userId;
    this.buyerName = data.buyerName;
    this.quantity = Number(data.quantity);
    this.totalPrice = Number(data.totalPrice);
    this.code = data.code;
    this.status = data.status || "active";
  }

  isCheckedIn() {
    return this.status === "checked-in";
  }

  toJSON() {
    return {
      ...super.toJSON(),
      eventId: this.eventId,
      userId: this.userId,
      buyerName: this.buyerName,
      quantity: this.quantity,
      totalPrice: this.totalPrice,
      code: this.code,
      status: this.status,
      checkedIn: this.isCheckedIn()
    };
  }
}
