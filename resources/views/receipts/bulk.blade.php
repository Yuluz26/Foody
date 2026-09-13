<!DOCTYPE html>
<html lang="ms">
<head>
    <meta charset="utf-8">
    <title>Resit pukal</title>
    @include('receipts._styles')
</head>
<body>
    @foreach($orders as $order)
        <div class="receipt">
            @include('receipts._receipt', ['order' => $order, 'restaurant' => $restaurant])
        </div>
    @endforeach
</body>
</html>
