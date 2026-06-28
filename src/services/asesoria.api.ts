import APIBase from "./httpBase";

export interface FeeCalculationInput {
  productValue: number;
  shippingValue: number;
  configId?: string;
}

export interface FeeCalculationResult {
  baseAmount: number;
  feeAmount: number;
  totalAmount: number;
  configId?: string;
  configName: string;
  ruleType: string;
  currency: string;
  breakdown: string;
}

export interface FeeTier {
  from: number;
  to: number;
  fixedAmount?: number;
  percentage?: number;
}

export type FeeRuleType = "fixed" | "percentage" | "fixed_plus_percentage" | "tiered";

export interface FeeConfig {
  _id: string;
  name: string;
  isDefault: boolean;
  currency: string;
  ruleType: FeeRuleType;
  fixedAmount?: number;
  percentage?: number;
  minAmount?: number;
  maxAmount?: number;
  tiers?: FeeTier[];
  enabled: boolean;
}

export type ServiceType = 'logistica' | 'compra_total';

export interface AuditEntry {
  timestamp: string;
  action: string;
  userId: string;
  userName: string;
  notes: string;
}

export interface PurchaseOrder {
  _id: string;
  asesorId: { _id: string; name: string; email: string } | string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  storeName: string;
  productUrl?: string;
  description: string;
  productValue: number;
  shippingValue: number;
  weightLb?: number;
  trackingUsa?: string;
  feeAmount: number;
  feeRuleApplied: string;
  totalAmount: number;
  currency: string;
  serviceType: ServiceType;
  status: string;
  paymentStatus: string;
  paymentLinkUrl?: string;
  transferProofUrl?: string;
  transferReference?: string;
  transferNotes?: string;
  notes?: string;
  adminNotes?: string;
  sharedWith?: { asesorId: string; sharedAt: string }[];
  auditLog?: AuditEntry[];
  viewToken?: string;
  viewTokenUsed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  storeName: string;
  productUrl?: string;
  description: string;
  productValue: number;
  shippingValue?: number;
  weightLb?: number;
  trackingUsa?: string;
  notes?: string;
  configId?: string;
  manualFeeAmount?: number;
  manualTotalAmount?: number;
}

class AsesoriaAPI extends APIBase {
  async calculateFee(input: FeeCalculationInput): Promise<{ result: FeeCalculationResult }> {
    const res = await this.post<{ result: FeeCalculationResult }>("v1/asesoria/calculate", input);
    return res.data;
  }

  async getFeeConfigs(): Promise<{ configs: FeeConfig[] }> {
    const res = await this.get<{ configs: FeeConfig[] }>("v1/asesoria/fee-configs");
    return res.data;
  }

  async getDefaultFeeConfig(): Promise<{ config: FeeConfig | null }> {
    const res = await this.get<{ config: FeeConfig | null }>("v1/asesoria/fee-configs/default");
    return res.data;
  }

  async createFeeConfig(config: Omit<FeeConfig, "_id">): Promise<{ config: FeeConfig }> {
    const res = await this.post<{ config: FeeConfig }>("v1/asesoria/fee-configs", config);
    return res.data;
  }

  async updateFeeConfig(id: string, config: Partial<FeeConfig>): Promise<{ config: FeeConfig }> {
    const res = await this.patch<{ config: FeeConfig }>(`v1/asesoria/fee-configs/${id}`, config);
    return res.data;
  }

  async setDefaultFeeConfig(id: string): Promise<{ config: FeeConfig }> {
    const res = await this.patch<{ config: FeeConfig }>(`v1/asesoria/fee-configs/${id}/default`, {});
    return res.data;
  }

  async deleteFeeConfig(id: string): Promise<{ message: string }> {
    const res = await this.delete<{ message: string }>(`v1/asesoria/fee-configs/${id}`);
    return res.data;
  }

  async listOrders(params?: {
    status?: string;
    paymentStatus?: string;
    includeShared?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: PurchaseOrder[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append("status", params.status);
    if (params?.paymentStatus) searchParams.append("paymentStatus", params.paymentStatus);
    if (params?.includeShared) searchParams.append("includeShared", "true");
    if (params?.limit) searchParams.append("limit", String(params.limit));
    if (params?.offset) searchParams.append("offset", String(params.offset));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const res = await this.get<{ orders: PurchaseOrder[]; total: number }>(`v1/asesoria/orders${query}`);
    return res.data;
  }

  async getOrder(id: string): Promise<{ order: PurchaseOrder }> {
    const res = await this.get<{ order: PurchaseOrder }>(`v1/asesoria/orders/${id}`);
    return res.data;
  }

  async createOrder(input: CreateOrderInput & { serviceType?: ServiceType }): Promise<{ order: PurchaseOrder }> {
    const res = await this.post<{ order: PurchaseOrder }>("v1/asesoria/orders", input);
    return res.data;
  }

  async updateOrderStatus(id: string, status: string, adminNotes?: string): Promise<{ order: PurchaseOrder }> {
    const res = await this.patch<{ order: PurchaseOrder }>(`v1/asesoria/orders/${id}/status`, {
      status,
      adminNotes,
    });
    return res.data;
  }

  async updatePaymentStatus(
    id: string,
    paymentStatus: string,
    adminNotes?: string,
  ): Promise<{ order: PurchaseOrder }> {
    const res = await this.patch<{ order: PurchaseOrder }>(`v1/asesoria/orders/${id}/payment-status`, {
      paymentStatus,
      adminNotes,
    });
    return res.data;
  }

  async generatePaymentLink(id: string): Promise<{ payment: any; order: PurchaseOrder }> {
    const res = await this.post<{ payment: any; order: PurchaseOrder }>(
      `v1/asesoria/orders/${id}/payment-link`,
      {},
    );
    return res.data;
  }

  async uploadTransferProof(
    id: string,
    formData: FormData,
  ): Promise<{ order: PurchaseOrder; upload: { url: string; publicId: string } }> {
    const res = await this.post<{ order: PurchaseOrder; upload: { url: string; publicId: string } }>(
      `v1/asesoria/orders/${id}/transfer`,
      formData,
    );
    return res.data;
  }

  async shareOrder(id: string, targetAsesorId: string): Promise<{ order: PurchaseOrder }> {
    const res = await this.post<{ order: PurchaseOrder }>(`v1/asesoria/orders/${id}/share`, { targetAsesorId });
    return res.data;
  }

  async unshareOrder(id: string, targetAsesorId: string): Promise<{ order: PurchaseOrder }> {
    const res = await this.delete<{ order: PurchaseOrder }>(`v1/asesoria/orders/${id}/share/${targetAsesorId}`);
    return res.data;
  }

  async getOrderByViewToken(token: string): Promise<{ order: Partial<PurchaseOrder> & { wasAlreadyUsed: boolean } }> {
    const res = await this.get<{ order: Partial<PurchaseOrder> & { wasAlreadyUsed: boolean } }>(`v1/asesoria/orders/view/${token}`);
    return res.data;
  }

  async resetViewToken(id: string): Promise<{ order: PurchaseOrder }> {
    const res = await this.post<{ order: PurchaseOrder }>(`v1/asesoria/orders/${id}/reset-view-token`, {});
    return res.data;
  }

  async searchClients(q: string): Promise<{ orders: PurchaseOrder[] }> {
    const res = await this.get<{ orders: PurchaseOrder[] }>(`v1/asesoria/clientes/search?q=${encodeURIComponent(q)}`);
    return res.data;
  }

  async getStats(): Promise<{
    stats: {
      totalOrders: number;
      pendingPayment: number;
      totalSold: number;
      recentOrders: PurchaseOrder[];
    };
  }> {
    const res = await this.get<{
      stats: {
        totalOrders: number;
        pendingPayment: number;
        totalSold: number;
        recentOrders: PurchaseOrder[];
      };
    }>("v1/asesoria/stats");
    return res.data;
  }
}

export const asesoriaApi = new AsesoriaAPI();
