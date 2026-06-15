declare module 'expo-auth-session' {
  export enum ResponseType {
    IdToken = 'id_token',
  }

  export interface AuthRequestConfig {
    clientId: string;
    responseType: ResponseType;
    scopes: string[];
    redirectUri: string;
    extraParams?: Record<string, string>;
    webClientId?: string;
    iosClientId?: string;
    androidClientId?: string;
  }

  export interface DiscoveryDocument {
    authorizationEndpoint?: string;
    tokenEndpoint?: string;
    revocationEndpoint?: string;
  }

  export interface AuthSessionResult {
    type: string;
    params?: Record<string, string>;
    error?: {
      message?: string;
    } | null;
    authentication?: {
      idToken?: string;
    };
  }

  export interface AuthRequest {
    promptAsync(discovery: DiscoveryDocument): Promise<AuthSessionResult>;
  }

  export function makeRedirectUri(options?: {
    isTripleSlashed?: boolean;
    native?: string;
    path?: string;
    preferLocalhost?: boolean;
    queryParams?: Record<string, string | undefined>;
    scheme?: string;
  }): string;
  export function fetchDiscoveryAsync(issuerOrDiscovery: string): Promise<DiscoveryDocument>;
  export function loadAsync(config: AuthRequestConfig, discovery: DiscoveryDocument): Promise<AuthRequest>;
}

declare module 'expo-network' {
  export interface NetworkState {
    isConnected?: boolean | null;
    isInternetReachable?: boolean | null;
  }

  export function getNetworkStateAsync(): Promise<NetworkState>;
}
