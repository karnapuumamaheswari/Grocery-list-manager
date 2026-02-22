import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { jsPDF } from "jspdf";
import { LogOut } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  Category,
  GroceryItem,
  MonthlySummary,
  PantryItem,
  ProductItem,
  PurchaseHistoryItem,
} from "@/types/app";

type Tab = "grocery" | "pantry" | "budget" | "history" | "products";
type Store = "BigBasket" | "JioMart" | "Blinkit";

const categories: Category[] = [
  "Produce",
  "Dairy",
  "Bakery",
  "Meat",
  "Frozen",
  "Pantry",
  "Beverages",
  "Snacks",
  "Other",
];

const stores: Record<Store, string> = {
  BigBasket: "https://www.bigbasket.com/ps/?q=",
  JioMart: "https://www.jiomart.com/search/",
  Blinkit: "https://blinkit.com/s/?q=",
};

const tabs: Tab[] = ["grocery", "pantry", "budget", "history", "products"];

const toAmount = (value: number) => Number(value ?? 0);

const startOfTodayUtc = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

export default function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>("grocery");
  const [loadingData, setLoadingData] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionInfo, setActionInfo] = useState("");

  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);

  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<Category>("Produce");
  const [newItemQty, setNewItemQty] = useState("1");
  const [newItemPrice, setNewItemPrice] = useState("0");

  const [editItemId, setEditItemId] = useState("");
  const [editItemName, setEditItemName] = useState("");
  const [editItemCategory, setEditItemCategory] = useState<Category>("Other");
  const [editItemQty, setEditItemQty] = useState("1");
  const [editItemPrice, setEditItemPrice] = useState("0");

  const [pantryName, setPantryName] = useState("");
  const [pantryQty, setPantryQty] = useState("1");
  const [pantryExpiry, setPantryExpiry] = useState("");
  const [editPantryId, setEditPantryId] = useState("");
  const [editPantryName, setEditPantryName] = useState("");
  const [editPantryQty, setEditPantryQty] = useState("1");
  const [editPantryExpiry, setEditPantryExpiry] = useState("");

  const [selectedStore, setSelectedStore] = useState<Store>("BigBasket");
  const [productSearch, setProductSearch] = useState("");

  const token = session?.access_token ?? "";

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setCheckingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const totalCost = useMemo(
    () =>
      groceryItems.reduce(
        (sum, item) => sum + toAmount(item.price) * toAmount(item.quantity),
        0,
      ),
    [groceryItems],
  );

  const groupedGrocery = useMemo(() => {
    const grouped: Record<string, GroceryItem[]> = {};
    groceryItems.forEach((item) => {
      const key = item.category || "Other";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    return grouped;
  }, [groceryItems]);

  const lowStock = useMemo(
    () => pantryItems.filter((item) => toAmount(item.quantity) <= 2),
    [pantryItems],
  );

  const expiringSoon = useMemo(() => {
    const today = startOfTodayUtc();
    const threeDaysOut = new Date(today);
    threeDaysOut.setUTCDate(threeDaysOut.getUTCDate() + 3);
    return pantryItems.filter((item) => {
      if (!item.expiry_date) return false;
      const exp = new Date(`${item.expiry_date}T00:00:00Z`);
      return exp >= today && exp <= threeDaysOut;
    });
  }, [pantryItems]);

  async function loadAll() {
    if (!token) return;

    setLoadingData(true);
    setActionError("");
    try {
      const [grocery, pantry, history, analytics, catalog] = await Promise.all([
        apiRequest("/api/grocery-items", token),
        apiRequest("/api/pantry", token),
        apiRequest("/api/purchase-history", token),
        apiRequest("/api/analytics/monthly-summary", token),
        apiRequest("/api/products?limit=30", token),
      ]);

      setGroceryItems(grocery ?? []);
      setPantryItems(pantry ?? []);
      setPurchaseHistory(history ?? []);
      setSummary(analytics ?? null);
      setProducts(catalog ?? []);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to load data.");
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    loadAll();
  }, [token]);

  async function handleAuthSubmit(event: FormEvent) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setActionInfo("Registration complete. If email confirmation is enabled, verify your inbox.");
        setIsLogin(true);
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setGroceryItems([]);
    setPantryItems([]);
    setPurchaseHistory([]);
    setSummary(null);
  }

  async function addGroceryItem(event: FormEvent) {
    event.preventDefault();
    setActionError("");
    setActionInfo("");

    const name = newItemName.trim();
    if (!name) return;

    const duplicatePantry = pantryItems.find(
      (item) => item.item_name.toLowerCase() === name.toLowerCase() && toAmount(item.quantity) > 0,
    );

    if (duplicatePantry) {
      setActionError(
        `Duplicate prevention: "${name}" already exists in pantry with quantity ${duplicatePantry.quantity}.`,
      );
      return;
    }

    try {
      await apiRequest("/api/grocery-items", token, {
        method: "POST",
        body: JSON.stringify({
          name,
          category: newItemCategory,
          quantity: Number(newItemQty || 1),
          price: Number(newItemPrice || 0),
        }),
      });

      setNewItemName("");
      setNewItemQty("1");
      setNewItemPrice("0");
      await loadAll();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not add grocery item.");
    }
  }

  function startEditGrocery(item: GroceryItem) {
    setEditItemId(item.id);
    setEditItemName(item.name);
    setEditItemCategory((item.category as Category) || "Other");
    setEditItemQty(String(item.quantity));
    setEditItemPrice(String(item.price));
  }

  async function saveEditGrocery(id: string) {
    try {
      await apiRequest(`/api/grocery-items/${id}`, token, {
        method: "PATCH",
        body: JSON.stringify({
          name: editItemName,
          category: editItemCategory,
          quantity: Number(editItemQty || 1),
          price: Number(editItemPrice || 0),
        }),
      });
      setEditItemId("");
      await loadAll();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not update grocery item.");
    }
  }

  async function deleteGrocery(id: string) {
    try {
      await apiRequest(`/api/grocery-items/${id}`, token, { method: "DELETE" });
      await loadAll();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not delete grocery item.");
    }
  }

  async function addPantryItem(event: FormEvent) {
    event.preventDefault();
    setActionError("");
    setActionInfo("");
    const itemName = pantryName.trim();
    if (!itemName) return;

    try {
      const response = await apiRequest("/api/pantry", token, {
        method: "POST",
        body: JSON.stringify({
          item_name: itemName,
          quantity: Number(pantryQty || 1),
          expiry_date: pantryExpiry || null,
        }),
      });

      setPantryName("");
      setPantryQty("1");
      setPantryExpiry("");
      if (response?.merged_duplicate) {
        setActionInfo("Duplicate pantry item merged into existing quantity.");
      }
      await loadAll();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not add pantry item.");
    }
  }

  function startEditPantry(item: PantryItem) {
    setEditPantryId(item.id);
    setEditPantryName(item.item_name);
    setEditPantryQty(String(item.quantity));
    setEditPantryExpiry(item.expiry_date ?? "");
  }

  async function saveEditPantry(id: string) {
    try {
      await apiRequest(`/api/pantry/${id}`, token, {
        method: "PATCH",
        body: JSON.stringify({
          item_name: editPantryName,
          quantity: Number(editPantryQty || 0),
          expiry_date: editPantryExpiry || null,
        }),
      });
      setEditPantryId("");
      await loadAll();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not update pantry item.");
    }
  }

  async function deletePantry(id: string) {
    try {
      await apiRequest(`/api/pantry/${id}`, token, { method: "DELETE" });
      await loadAll();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not delete pantry item.");
    }
  }

  async function finalizePurchase() {
    try {
      await apiRequest("/api/grocery-items/finalize", token, {
        method: "POST",
        body: JSON.stringify({ clear_list: true }),
      });
      setActionInfo("Purchase saved to history and current grocery list cleared.");
      await loadAll();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not finalize purchase.");
    }
  }

  async function searchProducts(term: string) {
    try {
      const data = await apiRequest(`/api/products?search=${encodeURIComponent(term)}&limit=50`, token);
      setProducts(data ?? []);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not search products.");
    }
  }

  function exportPdf() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Grocery List", 14, 20);

    let y = 32;
    groceryItems.forEach((item, idx) => {
      const line = `${idx + 1}. ${item.name} | Qty: ${item.quantity} | Cost: $${(
        Number(item.quantity) * Number(item.price)
      ).toFixed(2)}`;
      doc.setFontSize(11);
      doc.text(line, 14, y);
      y += 8;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    y += 4;
    doc.setFontSize(12);
    doc.text(`Total: $${totalCost.toFixed(2)}`, 14, y);
    doc.save("grocery-list.pdf");
  }

  function redirectToStore() {
    const terms = groceryItems.map((item) => item.name).join(" ");
    if (!terms) return;
    const query = encodeURIComponent(terms);
    const base = stores[selectedStore];
    const url = selectedStore === "JioMart" ? `${base}${query}` : `${base}${query}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (checkingSession) {
    return <div className="min-h-screen flex items-center justify-center">Loading session...</div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">
          <h1 className="text-2xl font-semibold mb-1">Smart Grocery Manager</h1>
          <p className="text-sm text-muted-foreground mb-5">
            Sign in to manage your personal grocery data and budget trends.
          </p>

          <form className="space-y-3" onSubmit={handleAuthSubmit}>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <Button className="w-full" disabled={authLoading}>
              {authLoading ? "Please wait..." : isLogin ? "Login" : "Register"}
            </Button>
          </form>

          {authError ? <p className="text-sm text-destructive mt-3">{authError}</p> : null}

          <button
            className="text-sm text-primary mt-4"
            onClick={() => setIsLogin((prev) => !prev)}
            type="button"
          >
            {isLogin ? "Create account" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap gap-3 items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Smart Grocery List Manager</h1>
            <p className="text-sm text-muted-foreground">{session.user.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "outline"}
              onClick={() => setActiveTab(tab)}
            >
              {tab[0].toUpperCase()}
              {tab.slice(1)}
            </Button>
          ))}
          <Button variant="outline" onClick={loadAll} disabled={loadingData}>
            {loadingData ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
        {actionInfo ? <p className="text-sm text-primary">{actionInfo}</p> : null}

        {activeTab === "grocery" && (
          <section className="space-y-4">
            <form className="rounded-xl border border-border bg-card p-4 grid gap-3 md:grid-cols-5" onSubmit={addGroceryItem}>
              <Input
                placeholder="Item name"
                value={newItemName}
                onChange={(event) => setNewItemName(event.target.value)}
                className="md:col-span-2"
              />
              <select
                className="border border-input rounded-md px-3 py-2 bg-background"
                value={newItemCategory}
                onChange={(event) => setNewItemCategory(event.target.value as Category)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <Input type="number" min="0" step="1" value={newItemQty} onChange={(event) => setNewItemQty(event.target.value)} />
              <Input type="number" min="0" step="0.01" value={newItemPrice} onChange={(event) => setNewItemPrice(event.target.value)} />
              <Button type="submit" className="md:col-span-5">
                Add grocery item
              </Button>
            </form>

            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-semibold">Total Cost: ${totalCost.toFixed(2)}</h2>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={exportPdf}>
                    Export PDF
                  </Button>
                  <select
                    className="border border-input rounded-md px-2 py-2 bg-background"
                    value={selectedStore}
                    onChange={(event) => setSelectedStore(event.target.value as Store)}
                  >
                    <option value="BigBasket">BigBasket</option>
                    <option value="JioMart">JioMart</option>
                    <option value="Blinkit">Blinkit</option>
                  </select>
                  <Button variant="outline" onClick={redirectToStore}>
                    Open Store Search
                  </Button>
                  <Button onClick={finalizePurchase} disabled={groceryItems.length === 0}>
                    Finalize Purchase
                  </Button>
                </div>
              </div>

              {Object.keys(groupedGrocery).length === 0 ? <p>No grocery items yet.</p> : null}

              {Object.entries(groupedGrocery).map(([category, items]) => (
                <div key={category} className="space-y-2">
                  <h3 className="font-medium">{category}</h3>
                  {items.map((item) => (
                    <div key={item.id} className="grid gap-2 md:grid-cols-7 items-center border border-border rounded-lg p-3">
                      {editItemId === item.id ? (
                        <>
                          <Input value={editItemName} onChange={(event) => setEditItemName(event.target.value)} className="md:col-span-2" />
                          <select
                            className="border border-input rounded-md px-3 py-2 bg-background"
                            value={editItemCategory}
                            onChange={(event) => setEditItemCategory(event.target.value as Category)}
                          >
                            {categories.map((current) => (
                              <option key={current} value={current}>
                                {current}
                              </option>
                            ))}
                          </select>
                          <Input type="number" min="0" step="1" value={editItemQty} onChange={(event) => setEditItemQty(event.target.value)} />
                          <Input type="number" min="0" step="0.01" value={editItemPrice} onChange={(event) => setEditItemPrice(event.target.value)} />
                          <Button onClick={() => saveEditGrocery(item.id)}>Save</Button>
                          <Button variant="outline" onClick={() => setEditItemId("")}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="md:col-span-2 font-medium">{item.name}</p>
                          <p className="text-sm">{item.category}</p>
                          <p className="text-sm">Qty: {item.quantity}</p>
                          <p className="text-sm">Price: ${Number(item.price).toFixed(2)}</p>
                          <Button variant="outline" onClick={() => startEditGrocery(item)}>
                            Edit
                          </Button>
                          <Button variant="destructive" onClick={() => deleteGrocery(item.id)}>
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "pantry" && (
          <section className="space-y-4">
            <form className="rounded-xl border border-border bg-card p-4 grid gap-3 md:grid-cols-4" onSubmit={addPantryItem}>
              <Input placeholder="Pantry item name" value={pantryName} onChange={(event) => setPantryName(event.target.value)} className="md:col-span-2" />
              <Input type="number" min="0" step="1" value={pantryQty} onChange={(event) => setPantryQty(event.target.value)} />
              <Input type="date" value={pantryExpiry} onChange={(event) => setPantryExpiry(event.target.value)} />
              <Button type="submit" className="md:col-span-4">
                Add to pantry
              </Button>
            </form>

            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <h2 className="text-xl font-semibold">Warnings</h2>
              <p className="text-sm">Low stock items ({"<="}2): {lowStock.length}</p>
              {lowStock.map((item) => (
                <p key={item.id} className="text-sm text-warning">
                  {item.item_name} - quantity {item.quantity}
                </p>
              ))}
              <p className="text-sm mt-2">Expiring within 3 days: {expiringSoon.length}</p>
              {expiringSoon.map((item) => (
                <p key={item.id} className="text-sm text-destructive">
                  {item.item_name} - expires {item.expiry_date}
                </p>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <h2 className="text-xl font-semibold">Pantry Items</h2>
              {pantryItems.length === 0 ? <p>No pantry data yet.</p> : null}
              {pantryItems.map((item) => (
                <div key={item.id} className="grid gap-2 md:grid-cols-6 items-center border border-border rounded-lg p-3">
                  {editPantryId === item.id ? (
                    <>
                      <Input value={editPantryName} onChange={(event) => setEditPantryName(event.target.value)} className="md:col-span-2" />
                      <Input type="number" min="0" step="1" value={editPantryQty} onChange={(event) => setEditPantryQty(event.target.value)} />
                      <Input type="date" value={editPantryExpiry} onChange={(event) => setEditPantryExpiry(event.target.value)} />
                      <Button onClick={() => saveEditPantry(item.id)}>Save</Button>
                      <Button variant="outline" onClick={() => setEditPantryId("")}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="md:col-span-2 font-medium">{item.item_name}</p>
                      <p className="text-sm">Qty: {item.quantity}</p>
                      <p className="text-sm">{item.expiry_date ?? "No expiry set"}</p>
                      <Button variant="outline" onClick={() => startEditPantry(item)}>
                        Edit
                      </Button>
                      <Button variant="destructive" onClick={() => deletePantry(item.id)}>
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "budget" && (
          <section className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h2 className="text-xl font-semibold">Budget & Analytics</h2>
            <p>Current list total: ${totalCost.toFixed(2)}</p>
            <p>Current month spend: ${summary?.current_month_total?.toFixed(2) ?? "0.00"}</p>
            <p>Previous month spend: ${summary?.previous_month_total?.toFixed(2) ?? "0.00"}</p>
            <p>
              Trend:{" "}
              {summary?.trend === "down" ? "Savings" : "Increase"}{" "}
              {summary ? `$${Math.abs(summary.change_amount).toFixed(2)}` : "$0.00"}
            </p>
            <p>Savings vs previous month: ${summary?.savings?.toFixed(2) ?? "0.00"}</p>
          </section>
        )}

        {activeTab === "history" && (
          <section className="rounded-xl border border-border bg-card p-4 space-y-2">
            <h2 className="text-xl font-semibold">Purchase History</h2>
            {purchaseHistory.length === 0 ? <p>No purchase history yet.</p> : null}
            {purchaseHistory.map((record) => (
              <div key={record.id} className="border border-border rounded-lg p-3 flex flex-wrap justify-between gap-2">
                <p className="font-medium">${Number(record.total_amount).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(record.purchase_date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </section>
        )}

        {activeTab === "products" && (
          <section className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h2 className="text-xl font-semibold">Static Product Catalog</h2>
            <div className="flex gap-2">
              <Input
                placeholder="Search product name"
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
              />
              <Button variant="outline" onClick={() => searchProducts(productSearch)}>
                Search
              </Button>
            </div>
            <div className="space-y-2">
              {products.map((product) => (
                <div key={product.id} className="border border-border rounded-lg p-3 flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.category} | {product.brand ?? "No brand"} | {product.store}
                    </p>
                  </div>
                  <p className="font-medium">${Number(product.price).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
