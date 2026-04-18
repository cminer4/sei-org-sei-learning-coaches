import type { NextAuthConfig } from "next-auth";
import AzureAD from "next-auth/providers/azure-ad";

const tenantId = process.env.AZURE_AD_TENANT_ID ?? "placeholder";
const issuer = `https://login.microsoftonline.com/${tenantId}/v2.0`;

export default {
  providers: [
    AzureAD({
      clientId: process.env.AZURE_AD_CLIENT_ID ?? "placeholder",
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET ?? "placeholder",
      issuer,
    }),
  ],
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/signin",
  },
} satisfies NextAuthConfig;
