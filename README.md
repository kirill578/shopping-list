# Shopping List App

A mobile-friendly single-page application for viewing and managing shopping carts from share-a-cart.com links.

## Features

- 📱 **Mobile-First Design**: Optimized for mobile devices with responsive card layout
- 🔗 **URL Parsing**: Support for share-a-cart.com URLs (e.g., `https://share-a-cart.com/get/T4GEU`)
- 🏪 **Real-time Cart Data**: Fetches live cart data from share-a-cart.com API
- ✅ **Interactive Items**: Check/uncheck items and modify quantities
- 💾 **Local Storage**: Persists your selections with `{cartId}-state` keys
- 💰 **Price Calculation**: Real-time total calculation for selected items
- 🔄 **Auto-refresh**: Smart caching with 24-hour refresh for cart data
- ⚡ **Modern Tech**: Built with React 18, Vite 7, and TypeScript

## How to Use

1. **Enter Cart URL**: Paste your share-a-cart.com link or cart ID

   - Format: `https://share-a-cart.com/get/T4GEU` or just `T4GEU`
   - URL persists as `/#T4GEU` for easy sharing

2. **Manage Your List**:

   - Check items to include them in your selection
   - Adjust quantities using +/- buttons or direct input
   - View real-time price totals for selected items

3. **Persistent State**: Your selections are automatically saved locally

## Tech Stack

- **React 18.x** with TypeScript for robust UI components
- **Vite 7.x** for lightning-fast development and builds
- **React Router 7.x** for client-side routing
- **Zod 4.x** for runtime data validation
- **Modern CSS** with mobile-first responsive design

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## API Integration

The app integrates with the share-a-cart.com API:

- **Endpoint**: `https://share-a-cart.com/api/get/r/cart/{cartId}`
- **Validation**: Full Zod schema validation with unknown field tolerance
- **Error Handling**: Graceful handling of API failures and invalid data

## Browser Support

Works on all modern browsers with support for:

- ES2022+ features
- CSS Grid and Flexbox
- Local Storage API
- Fetch API

## License

MIT License - feel free to use this code for your own projects!
