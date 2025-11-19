-- Allow sellers to update order status for their own orders
CREATE POLICY "Sellers can update order status"
ON public.orders
FOR UPDATE
USING (auth.uid() = seller_id);