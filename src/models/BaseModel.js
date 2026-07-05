export default class BaseModel {
  constructor(data) {
    this.id = data.id;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  isNewRecord() {
    return !this.id;
  }

  toJSON() {
    return {
      id: this.id,
      createdAt: this.createdAt
    };
  }
}
