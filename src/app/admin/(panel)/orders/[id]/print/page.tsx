"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { STORE } from "@/lib/store";
import { formatInr } from "@/lib/money";

export default function PrintOrderPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then((res) => res.json())
      .then(setOrder);
  }, [id]);

  if (!order?.orderNumber) return <p>Loading invoice…</p>;

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-sm print:p-0">
      <div className="flex justify-between">
        <div>
          <h1 className="display text-3xl text-forest">{STORE.name}</h1>
          <p>{STORE.address}</p>
          <p>{STORE.phone}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">Invoice / packing slip</p>
          <p>{order.orderNumber}</p>
          <p>{new Date(order.createdAt).toLocaleString("en-IN")}</p>
        </div>
      </div>
      <hr className="my-6" />
      <p className="font-semibold">Deliver to</p>
      <p>{order.customerName}</p>
      <p>{order.customerPhone}</p>
      <p>{order.addressLine}</p>
      <p>{order.city}, {order.state} {order.pincode}</p>
      <table className="mt-6 w-full text-left">
        <thead>
          <tr>
            <th className="border-b py-2">Item</th>
            <th>Size</th>
            <th>Qty</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item: any) => (
            <tr key={item.id}>
              <td className="py-2">{item.productName}<br /><span className="text-muted">{item.barcode || item.sku}</span></td>
              <td>{item.size}</td>
              <td>{item.quantity}</td>
              <td>{formatInr(Number(item.lineTotal))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-6 text-right font-semibold">Total {formatInr(Number(order.total))}</p>
      <button onClick={() => window.print()} className="mt-8 rounded-full bg-forest px-4 py-2 text-white print:hidden">
        Print
      </button>
    </div>
  );
}
