import APIBase from "./httpBase";

class AdminAPI extends APIBase {
  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const token = localStorage.getItem("admin_token");
    if (token && token !== "null") {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  async login(email: string, password: string) {
    const res = await this.post<any>("auth/login", { email, password });
    return res.data;
  }

  async getPayments() {
    const res = await this.get<any>("payments");
    return res.data;
  }

  async generateLink(payload: {
    amount: number;
    amountWithoutTax: number;
    amountWithTax: number;
    tax: number;
    reference: string;
    customerEmail?: string;
    customerName?: string;
  }) {
    const res = await this.post<any>("payments/generate", payload);
    return res.data;
  }

  async deletePayment(id: string) {
    const res = await this.delete<any>(`payments/${id}`);
    return res.data;
  }

  async getUsers() {
    const res = await this.get<any>("users");
    return res.data;
  }

  async createUser(payload: { email: string; password?: string; name: string; role?: string }) {
    const res = await this.post<any>("users", payload);
    return res.data;
  }

  async updateUser(id: string, payload: { email?: string; password?: string; name?: string; role?: string }) {
    const res = await this.put<any>(`users/${id}`, payload);
    return res.data;
  }

  async deleteUser(id: string) {
    const res = await this.delete<any>(`users/${id}`);
    return res.data;
  }

  async getGeneralMetrics(locationId: string, startDate?: string, endDate?: string) {
    let url = `admin/metrics/general?locationId=${locationId}&_t=${Date.now()}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    
    const res = await this.get<any>(url);
    return res.data;
  }

  async getDailyChartMetrics(locationId: string) {
    const url = `admin/metrics/chart-data?locationId=${locationId}&_t=${Date.now()}`;
    const res = await this.get<any>(url);
    return res.data;
  }

  async getActiveAgents(locationId: string, startDate?: string, endDate?: string) {
    let url = `admin/metrics/agents?locationId=${locationId}&_t=${Date.now()}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    
    const res = await this.get<any>(url);
    return res.data;
  }

  async getRecentConversations(locationId: string, startDate?: string, endDate?: string) {
    let url = `admin/metrics/recent-conversations?locationId=${locationId}&_t=${Date.now()}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    
    const res = await this.get<any>(url);
    return res.data;
  }
  async getData(endpoint: string) {
    const res = await this.get<any>(endpoint);
    return res.data;
  }

  async downloadData(endpoint: string) {
    const res = await this.get<Blob>(endpoint, undefined, { responseType: 'blob', timeout: 60000 });
    return res.data;
  }

  async postData(endpoint: string, data: unknown) {
    const res = await this.post<any>(endpoint, data);
    return res.data;
  }

  async deleteData(endpoint: string) {
    const res = await this.delete<any>(endpoint);
    return res.data;
  }
}

export const adminApi = new AdminAPI();
