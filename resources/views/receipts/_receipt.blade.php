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
