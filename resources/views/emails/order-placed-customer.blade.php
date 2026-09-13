<x-mail::message>
# Terima kasih, {{ $order->customer_name }}!

Pesanan anda di **{{ $restaurant->name }}** telah diterima.

<x-mail::panel>
No. Pesanan: **{{ $order->order_number }}**<br>
Jenis: **{{ $order->type->label() }}{{ $order->table_number ? ', Meja '.$order->table_number : '' }}**<br>
Kaedah bayaran: **{{ $order->payment_method->label() }}**<br>
Status bayaran: **{{ $order->payment_status->label() }}**
</x-mail::panel>

<x-mail::table>
| Item | Kuantiti | Jumlah |
| :--- | :---: | ---: |
@foreach ($order->items as $item)
| {{ $item->product_name }}@if ($item->addOns->isNotEmpty()) &mdash; {{ $item->addOns->pluck('name')->join(', ') }} @endif | {{ $item->quantity }} | RM {{ number_format($item->line_total / 100, 2) }} |
@endforeach
</x-mail::table>

**Jumlah keseluruhan: RM {{ number_format($order->total / 100, 2) }}**

@if ($order->notes)
Nota: {{ $order->notes }}
@endif

<x-mail::button :url="route('orders.show', $order)">
Semak status pesanan
</x-mail::button>

Terima kasih kerana memesan bersama kami.<br>
{{ $restaurant->name }}
</x-mail::message>
