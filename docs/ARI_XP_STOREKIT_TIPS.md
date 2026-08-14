# ARI XP StoreKit Tip Bridge

## Purpose

The ARI XP web UI already owns the Support ARI XP presentation. The native iOS shell only needs to provide StoreKit product loading and purchasing through a small WKWebView bridge.

Tips are voluntary. A successful tip must never unlock features, increase AI usage, grant tokens or credits, change limits, alter account state, or provide digital benefits.

## Native message handler

Register this WKScriptMessageHandler name:

`ariStoreKit`

The web layer detects it at:

`window.webkit.messageHandlers.ariStoreKit`

## Messages from ARI XP to iOS

### Load products

```json
{
  "action": "load_tip_products",
  "productIds": [
    "com.arixp.support.tip.1",
    "com.arixp.support.tip.2",
    "com.arixp.support.tip.3"
  ]
}
```

The native shell should load these product IDs with StoreKit and return only products available in the current App Store storefront.

### Purchase a tip

```json
{
  "action": "purchase_tip",
  "productId": "com.arixp.support.tip.5"
}
```

The native shell should start a StoreKit purchase for that exact product ID.

## Callbacks from iOS to ARI XP

### Products loaded

Evaluate JavaScript similar to:

```js
window.AriSupportStoreKit.productsLoaded([
  {
    id: "com.arixp.support.tip.1",
    displayPrice: "$1.00",
    available: true
  }
]);
```

`displayPrice` must come from StoreKit so it is localized for the user's storefront and currency.

### Purchase finished

Success:

```js
window.AriSupportStoreKit.purchaseFinished({
  productId: "com.arixp.support.tip.5",
  status: "success"
});
```

Canceled:

```js
window.AriSupportStoreKit.purchaseFinished({
  productId: "com.arixp.support.tip.5",
  status: "cancelled"
});
```

Pending:

```js
window.AriSupportStoreKit.purchaseFinished({
  productId: "com.arixp.support.tip.5",
  status: "pending"
});
```

Failure:

```js
window.AriSupportStoreKit.purchaseFinished({
  productId: "com.arixp.support.tip.5",
  status: "failed",
  message: "The Apple tip could not be completed."
});
```

## Product IDs

Featured support options:

- `com.arixp.support.tip.1`
- `com.arixp.support.tip.3`
- `com.arixp.support.tip.5`
- `com.arixp.support.tip.10`
- `com.arixp.support.tip.20`
- `com.arixp.support.tip.50`

Additional options shown under **Other amount**:

- `com.arixp.support.tip.2`
- `com.arixp.support.tip.4`
- `com.arixp.support.tip.7`
- `com.arixp.support.tip.15`
- `com.arixp.support.tip.25`
- `com.arixp.support.tip.100`

The product IDs are defined in `js/support-ari-config.js` and should be created as consumable tip products in App Store Connect when the iOS app is configured.

## Web fallback

When the `ariStoreKit` native handler is absent, `support-ari.html` automatically shows the configured web support methods instead. The iOS shell therefore does not need to expose Cash App or Venmo.
