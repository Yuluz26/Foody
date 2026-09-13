<!DOCTYPE html>
<html lang="ms">
<head>
    <meta charset="utf-8">
    <title>Resit {{ $order->order_number }}</title>
    @include('receipts._styles')
</head>
<body>
    <div class="receipt">
        @include('receipts._receipt', ['order' => $order, 'restaurant' => $restaurant])
    </div>
</body>
</html>
