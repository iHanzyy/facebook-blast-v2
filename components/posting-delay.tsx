export function PostingDelay({
  delayMin,
  delayMax,
  disabled,
  isValid,
  onMinChange,
  onMaxChange,
}: {
  delayMin: string;
  delayMax: string;
  disabled: boolean;
  isValid: boolean;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}) {
  return (
    <fieldset
      disabled={disabled}
      className="border border-line bg-panel px-4 py-4 disabled:opacity-60 sm:px-5"
    >
      <legend className="px-1 text-sm font-semibold text-ink">
        Jeda pengiriman
      </legend>
      <p className="mt-1 text-xs leading-5 text-muted">
        Sistem memilih jeda acak di antara batas minimum dan maksimum.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DelayInput
          id="delay-min"
          label="Minimum"
          value={delayMin}
          onChange={onMinChange}
        />
        <DelayInput
          id="delay-max"
          label="Maksimum"
          value={delayMax}
          onChange={onMaxChange}
        />
      </div>
      {!isValid ? (
        <p role="alert" className="mt-3 text-xs text-rose-700">
          Gunakan bilangan bulat 1–3.600 detik; minimum tidak boleh melebihi maksimum.
        </p>
      ) : null}
    </fieldset>
  );
}

function DelayInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-xs font-medium text-muted" htmlFor={id}>
      {label}
      <span className="relative mt-2 block">
        <input
          id={id}
          type="number"
          min="1"
          max="3600"
          step="1"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-11 w-full border border-line bg-white px-3 pr-14 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-blue-100"
        />
        <span className="pointer-events-none absolute right-3 top-3 text-xs text-muted">
          detik
        </span>
      </span>
    </label>
  );
}
