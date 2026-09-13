<x-mail::message>
# Pesanan dibatalkan: {{ $order->order_number }}

Pelanggan telah membatalkan pesanan ini sendiri.

<x-mail::panel>
Pelanggan: **{{ $order->customer_name }}** ({{ $order->customer_phone }})<br>
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

@if ($order->payment_status->value !== 'unpaid')
Sila semak sama ada bayaran ini perlu dikembalikan kepada pelanggan.
@endif

<x-mail::button :url="$adminUrl">
Lihat pesanan di panel admin
</x-mail::button>
</x-mail::message>
