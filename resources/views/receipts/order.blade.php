<!DOCTYPE html>
<html lang="ms">
<head>
    <meta charset="utf-8">
    <title>Resit {{ $order->order_number }}</title>
    <style>
        @page { margin: 24px; }
        body { font-family: 'Helvetica', sans-serif; color: #1a1a1a; font-size: 12px; }
        .header { text-align: center; margin-bottom: 16px; }
        .header .name { font-size: 18px; font-weight: bold; margin: 0 0 2px; }
        .header .meta { font-size: 11px; color: #555; margin: 0; }
        .divider { border-top: 1px dashed #999; margin: 12px 0; }
        table { width: 100%; border-collapse: collapse; }
        .info-table td { padding: 2px 0; vertical-align: top; }
        .info-table td.label { color: #555; width: 38%; }
        .items-table th { text-align: left; border-bottom: 1px solid #333; padding: 4px 0; font-size: 11px; }
        .items-table td { padding: 4px 0; border-bottom: 1px solid #eee; }
        .items-table .add-ons { display: block; font-size: 10px; color: #777; }
        .items-table .num { text-align: right; }
        .totals-table td { padding: 2px 0; }
        .totals-table .label { text-align: right; color: #555; }
        .totals-table .value { text-align: right; width: 90px; }
        .totals-table .grand .label, .totals-table .grand .value { font-weight: bold; font-size: 14px; color: #1a1a1a; }
        .badge { display: inline-block; padding: 2px 8px; border: 1px solid #999; border-radius: 10px; font-size: 10px; }
        .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #555; }
    </style>
</head>
<body>
    <div class="header">
        <p class="name">{{ $restaurant->name }}</p>
        @if($restaurant->address)
            <p class="meta">{{ $restaurant->address }}</p>
        @endif
        @if($restaurant->phone)
            <p class="meta">{{ $restaurant->phone }}</p>
        @endif
    </div>

    <div class="divider"></div>

    <table class="info-table">
        <tr>
            <td class="label">No. Pesanan</td>
            <td>{{ $order->order_number }}</td>
        </tr>
        <tr>
            <td class="label">Tarikh</td>
            <td>{{ $order->created_at->timezone(config('app.timezone'))->translatedFormat('d M Y, h:i A') }}</td>
        </tr>
        <tr>
            <td class="label">Nama Pelanggan</td>
            <td>{{ $order->customer_name }}</td>
        </tr>
        <tr>
            <td class="label">Jenis Pesanan</td>
            <td>{{ $order->type->label() }}{{ $order->table_number ? ' — Meja '.$order->table_number : '' }}</td>
        </tr>
        <tr>
            <td class="label">Kaedah Bayaran</td>
            <td>{{ $order->payment_method->label() }}</td>
        </tr>
        <tr>
            <td class="label">Status Bayaran</td>
            <td><span class="badge">{{ $order->payment_status->label() }}</span></td>
        </tr>
        <tr>
            <td class="label">Status Pesanan</td>
            <td><span class="badge">{{ $order->status->label() }}</span></td>
        </tr>
    </table>

    <div class="divider"></div>

    <table class="items-table">
        <thead>
            <tr>
                <th>Item</th>
                <th class="num">Kuantiti</th>
                <th class="num">Harga</th>
                <th class="num">Jumlah</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->items as $item)
                <tr>
                    <td>
                        {{ $item->product_name }}
                        @if($item->addOns->isNotEmpty())
                            <span class="add-ons">{{ $item->addOns->pluck('name')->join(', ') }} (+RM {{ number_format($item->add_ons_total / 100, 2) }})</span>
                        @endif
                    </td>
                    <td class="num">{{ $item->quantity }}</td>
                    <td class="num">RM {{ number_format($item->unit_price / 100, 2) }}</td>
                    <td class="num">RM {{ number_format($item->line_total / 100, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals-table" style="margin-top: 8px;">
        <tr>
            <td class="label">Subjumlah</td>
            <td class="value">RM {{ number_format($order->subtotal / 100, 2) }}</td>
        </tr>
        <tr class="grand">
            <td class="label">Jumlah</td>
            <td class="value">RM {{ number_format($order->total / 100, 2) }}</td>
        </tr>
    </table>

    @if($order->notes)
        <div class="divider"></div>
        <p><strong>Nota:</strong> {{ $order->notes }}</p>
    @endif

    <div class="footer">
        <p>Terima kasih atas pesanan anda!</p>
    </div>
</body>
</html>
