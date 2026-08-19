import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { ShopLayout } from "@/layouts/ShopLayout";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetailPage from "@/pages/ProductDetailPage";
import NotFound from "@/pages/NotFound";

export function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route element={<ShopLayout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:slug" element={<ProductDetailPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}
