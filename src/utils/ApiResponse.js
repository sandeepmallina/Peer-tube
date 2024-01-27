class ApiResponse {
  constructor(statusCode, message = "Success") {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = true;
    this.errors = statusCode < 400;
  }
}
export default ApiResponse;
