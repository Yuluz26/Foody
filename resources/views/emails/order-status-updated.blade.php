<x-mail::message>
# Pesanan {{ $order->order_number }} kini {{ $order->status->label() }}

Hai {{ $order->customer_name }}, status pesanan anda di **{{ $restaurant->name }}** telah dikemas kini.

<x-mail::panel>
Status terkini: **{{ $order->status->label() }}**
</x-mail::panel>

<x-mail::button :url="$statusUrl">
Semak status pesanan
</x-mail::button>

Terima kasih,<br>
{{ $restaurant->name }}
</x-mail::message>
