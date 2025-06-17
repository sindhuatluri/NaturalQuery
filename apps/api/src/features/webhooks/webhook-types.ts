export interface UserCreated {
  data: Data;
  event_attributes: EventAttributes;
  object: string;
  timestamp: number;
  type: string;
}

export interface Data {
  birthday: string;
  created_at: number;
  email_addresses: EmailAddress[];
  external_accounts: any[];
  external_id: string;
  first_name: string;
  gender: string;
  id: string;
  image_url: string;
  last_name: string;
  last_sign_in_at: number;
  object: string;
  password_enabled: boolean;
  phone_numbers: any[];
  primary_email_address_id: string;
  primary_phone_number_id: null;
  primary_web3_wallet_id: null;
  private_metadata: Metadata;
  profile_image_url: string;
  public_metadata: Metadata;
  two_factor_enabled: boolean;
  unsafe_metadata: Metadata;
  updated_at: number;
  username: null;
  web3_wallets: any[];
}

export interface EmailAddress {
  email_address: string;
  id: string;
  linked_to: any[];
  object: string;
  verification: Verification;
}

export interface Verification {
  status: string;
  strategy: string;
}

export interface Metadata {}

export interface EventAttributes {
  http_request: HTTPRequest;
}

export interface HTTPRequest {
  client_ip: string;
  user_agent: string;
}
