/* ARI Circle fast client bootstrap
   Uses the already-persisted Supabase session for initial UI identity,
   while all database/RPC access remains server-authorized by Supabase.
*/
(() => {
  "use strict";

  const client = window.calbuddySupabase || window.supabaseClient || null;
  if (!client?.auth?.getSession || !client?.auth?.getUser) return;
  if (client.auth.__ariFastGetUserInstalled) return;

  const originalGetUser = client.auth.getUser.bind(client.auth);

  client.auth.getUser = async function ariFastGetUser(...args) {
    try {
      const { data, error } = await client.auth.getSession();
      const user = data?.session?.user || null;
      if (!error && user) {
        return { data: { user }, error: null };
      }
    } catch {}

    return originalGetUser(...args);
  };

  Object.defineProperty(client.auth, "__ariFastGetUserInstalled", {
    value: true,
    configurable: false,
    enumerable: false,
    writable: false
  });
})();