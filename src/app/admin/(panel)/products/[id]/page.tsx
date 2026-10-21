"use client";

import { useParams } from "next/navigation";
import { ProductForm } from "../ProductForm";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <h1 className="display mb-6 text-3xl text-forest">Edit product</h1>
      <ProductForm productId={id} />
    </div>
  );
}
