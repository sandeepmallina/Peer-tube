class ApiResponse {
  constructor(statusCode, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.errors = statusCode < 400;
  }
}
export default ApiResponse;
