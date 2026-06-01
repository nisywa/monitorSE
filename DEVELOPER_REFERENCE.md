# QUICK REFERENCE - IMPORT WILAYAH KERJA

## API Endpoint

```
POST /wilayah-kerja/import
```

### Request Body
```json
{
  "rows": [
    {
      "kecamatan": "Patampanua",
      "desa": "Desa A",
      "sls": "001.01.01"
    },
    {
      "kecamatan": "Patampanua",
      "desa": "Desa A",
      "sls": "001.01.02"
    }
  ]
}
```

### Response Success (Redirect)
```
Status: 302 (Redirect)
Flash Message: "X data wilayah kerja berhasil diimport."
```

### Response Error (Validation Failed)
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "rows": ["Data import tidak boleh kosong."],
    "rows.0.kecamatan": ["Nama kecamatan wajib diisi."],
    "rows.0.desa": ["Nama desa wajib diisi."],
    "rows.0.sls": ["Nomor SLS wajib diisi."]
  }
}
```

## Component Files

### Frontend Component
**File**: `resources/js/Pages/Admin/WilayahKerja/Index.jsx`

**Key Functions**:
- `handleDownloadTemplate()` - Generate Excel template
- `handleFileChange(e)` - Read Excel file & validate
- `handleImportSubmit()` - Submit to backend
- `closeImportModal()` - Close modal & reset state

**State Variables**:
- `showImportModal` - Modal visibility
- `importPreview` - Array of validated rows
- `importErrors` - Array of error messages
- `importing` - Loading state during submit
- `fileInputRef` - Ref to file input element

### Backend Controller
**File**: `app/Http/Controllers/WilayahKerjaController.php`

**Method**: `import(Request $request)`

**Process**:
1. Validate request data
2. Start DB transaction
3. Loop through rows:
   - Find or create Kecamatan
   - Find or create Desa
   - Find or create SLS
   - Count success
4. Return redirect with flash message

## Excel File Structure

### Column Names (Case Sensitive)
- `Kecamatan` - String, required
- `Desa` - String, required
- `SLS` - String, required

### Data Types
- All columns: String (max 255 chars)
- No special formatting required
- Headers in row 1
- Data starts from row 2

### File Formats Supported
- .xlsx (Office Excel)
- .xls (Legacy Excel)

NOT supported:
- .csv (use manual entry)
- .ods (LibreOffice - may work but not tested)
- .tsv (Tab-separated)

## Database Schema

### Models Used
```
App\Models\Kecamatan
App\Models\Desa
App\Models\Sls
```

### Model Relationships
```php
Kecamatan::hasMany(Desa)  // one-to-many
Desa::belongsTo(Kecamatan) // inverse
Desa::hasMany(Sls)         // one-to-many
Sls::belongsTo(Desa)       // inverse
```

### Table Attributes
```
kecamatan table:
- id (PK)
- nama (string)
- kabupaten (string) ← Always 'Pinrang'
- provinsi (string) ← Always 'Sulawesi Selatan'
- created_at, updated_at

desa table:
- id (PK)
- kecamatan_id (FK)
- nama (string)
- created_at, updated_at

sls table:
- id (PK)
- desa_id (FK)
- nomor_sls (string)
- jumlah_rumah_tangga (nullable integer)
- created_at, updated_at
```

## Route Definition

```php
Route::post('/wilayah-kerja/import', 
    [WilayahKerjaController::class, 'import']
)->name('wilayah-kerja.import');
```

**Middleware**: `auth`, `role:admin` (protected routes group)

## Validation Rules

```php
'rows' => 'required|array|min:1',
'rows.*.kecamatan' => 'required|string|max:255',
'rows.*.desa' => 'required|string|max:255',
'rows.*.sls' => 'required|string|max:255',
```

## Error Messages (Bahasa Indonesia)

```php
[
    'rows.required' => 'Data import tidak boleh kosong.',
    'rows.*.kecamatan.required' => 'Nama kecamatan wajib diisi.',
    'rows.*.desa.required' => 'Nama desa wajib diisi.',
    'rows.*.sls.required' => 'Nomor SLS wajib diisi.',
]
```

## Frontend Libraries Required

```json
{
  "xlsx": "^0.18.5" (or any version supporting sheet_to_json)
}
```

## CSS Framework Used

- **Tailwind CSS** - All styling
- Classes: `flex`, `gap-`, `px-`, `py-`, `bg-`, `text-`, `rounded-lg`, etc.

## Performance Considerations

### Frontend
- XLSX parsing is synchronous (blocks UI for large files)
- Typical Excel read: 50-100ms per 1000 rows
- Validation loop: Real-time, parallel with parsing

### Backend
- Database transaction overhead: ~10-50ms
- Per-row processing: ~5-20ms (depending on DB)
- Typical batch of 100 rows: ~1-2 seconds

### Optimization Tips
- Keep batch size under 1000 rows
- Use async/await if needed on frontend
- Consider background jobs for very large imports (future)

## Common Issues & Solutions

### Issue: File not read
**Solution**: Check if browser supports FileReader API (IE10+)

### Issue: Data not showing in preview
**Solution**: Verify column names match exactly (case-sensitive)

### Issue: Import fails silently
**Solution**: Check browser console (F12) and Laravel logs (storage/logs/)

### Issue: Duplicate data after import
**Solution**: This is normal - `firstOrCreate` prevents true duplicates, but same row imported twice creates 2 entries

## Dependencies

### Backend
- Laravel 11+
- PHP 8.1+
- Eloquent ORM

### Frontend
- React 18+
- Inertia.js
- XLSX (SheetJS) library

## Security

- CSRF token required in POST request header
- Auth & role middleware required
- Input validation on both sides
- No file upload to server (client-side processing)
- Database transaction for atomicity

## Testing Endpoints

### Manual Test
```bash
# Test with curl
curl -X POST http://localhost:8000/wilayah-kerja/import \
  -H "Content-Type: application/json" \
  -H "X-CSRF-TOKEN: $(csrf_token)" \
  -d '{
    "rows": [
      {
        "kecamatan": "Patampanua",
        "desa": "Test Desa",
        "sls": "999.99.99"
      }
    ]
  }'
```

### Browser DevTools
```javascript
// In browser console
fetch('/wilayah-kerja/import', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-TOKEN': document.querySelector('[name="_token"]').value
  },
  body: JSON.stringify({
    rows: [
      { kecamatan: 'Test', desa: 'Test', sls: '001.01.01' }
    ]
  })
}).then(r => r.text()).then(console.log)
```

## Logs to Check

When debugging:
1. Browser console: `F12 → Console`
2. Browser network: `F12 → Network → XHR`
3. Laravel log: `storage/logs/laravel.log`
4. Query log: Enable in `.env` → `DB_QUERY_LOG=true`

---

**Reference Version**: 1.0  
**Last Updated**: 2026-06-01
