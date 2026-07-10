# Elixir/Phoenix Pattern Reference

This file is loaded by the `/mvp build` orchestrator for screen-building agents in the `core` and `polish` phases only. It provides standard code patterns and component references for consistency.

---

## Standard LiveView Pattern
```elixir
defmodule MyAppWeb.SomeLive do
  use MyAppWeb, :live_view

  def mount(_params, _session, socket) do
    {:ok,
     socket
     |> assign(:page_title, "Page Name")
     |> assign(:data, load_data())}
  end

  def handle_params(%{"id" => id}, _uri, socket) do
    {:noreply,
     socket
     |> assign(:page_title, "Item Name")
     |> assign(:item, Context.get_item!(id))}
  end

  def handle_event("save", params, socket) do
    case Context.create_thing(params) do
      {:ok, thing} ->
        {:noreply,
         socket
         |> put_flash(:info, "Created successfully!")
         |> push_navigate(to: ~p"/things/#{thing.id}")}

      {:error, changeset} ->
        {:noreply, assign(socket, :changeset, changeset)}
    end
  end

  def render(assigns) do
    ~H"""
    <div>
      <h1 class="text-2xl font-bold"><%= @page_title %></h1>
    </div>
    """
  end
end
```

## Standard Context Pattern
```elixir
defmodule MyApp.Things do
  alias MyApp.Repo
  alias MyApp.Things.Thing

  def list_things do
    Repo.all(Thing)
    |> Repo.preload([:association])        # preload what views need
  end

  def get_thing!(id) do
    Repo.get!(Thing, id)
    |> Repo.preload([nested: :deep])       # preload full chain
  end

  def create_thing(attrs) do
    %Thing{}
    |> Thing.changeset(attrs)
    |> Repo.insert()
  end

  def update_thing(%Thing{} = thing, attrs) do
    thing
    |> Thing.changeset(attrs)
    |> Repo.update()
  end

  def delete_thing(%Thing{} = thing), do: Repo.delete(thing)

  def change_thing(%Thing{} = thing, attrs \\ %{}), do: Thing.changeset(thing, attrs)
end
```

## ExUnit Test Patterns
```elixir
# test/my_app/things_test.exs
defmodule MyApp.ThingsTest do
  use MyApp.DataCase, async: true
  import MyApp.Factory

  alias MyApp.Things

  describe "create_thing/1" do
    test "creates with valid attrs" do
      assert {:ok, thing} = Things.create_thing(%{name: "Test"})
      assert thing.name == "Test"
    end

    test "returns error with invalid attrs" do
      assert {:error, changeset} = Things.create_thing(%{})
      assert "can't be blank" in errors_on(changeset).name
    end
  end
end
```

```elixir
# test/my_app_web/live/thing_live_test.exs
defmodule MyAppWeb.ThingLiveTest do
  use MyAppWeb.ConnCase, async: true
  import Phoenix.LiveViewTest
  import MyApp.Factory

  describe "Index" do
    test "lists things", %{conn: conn} do
      thing = insert(:thing)
      {:ok, _view, html} = live(conn, ~p"/things")
      assert html =~ thing.name
    end

    test "creates a thing", %{conn: conn} do
      {:ok, view, _html} = live(conn, ~p"/things/new")

      view
      |> form("#thing-form", thing: %{name: "New Thing"})
      |> render_submit()

      assert_redirect(view, ~p"/things")
    end
  end
end
```

## Factory Pattern (`test/support/factory.ex`)
```elixir
defmodule MyApp.Factory do
  alias MyApp.Repo

  def build(:thing, attrs \\ %{}) do
    %MyApp.Things.Thing{
      name: Faker.Lorem.word(),
      description: Faker.Lorem.sentence()
    }
    |> Map.merge(Enum.into(attrs, %{}))
  end

  def insert(factory_name, attrs \\ %{}) do
    factory_name
    |> build(attrs)
    |> Repo.insert!()
  end
end
```

## DaisyUI Component Quick Reference
```html
<!-- Buttons -->
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary btn-sm">Small</button>
<button class="btn btn-outline btn-error">Outline Error</button>

<!-- Cards -->
<div class="card card-bordered shadow-sm bg-base-100">
  <div class="card-body">
    <h2 class="card-title">Title</h2>
    <p>Content</p>
    <div class="card-actions justify-end">
      <button class="btn btn-primary">Action</button>
    </div>
  </div>
</div>

<!-- Badges -->
<span class="badge badge-success">Active</span>
<span class="badge badge-error badge-outline">Error</span>

<!-- Form inputs -->
<label class="form-control w-full">
  <div class="label"><span class="label-text">Name</span></div>
  <input type="text" class="input input-bordered w-full" phx-debounce="300" />
</label>

<!-- Alert/Flash -->
<div class="alert alert-success"><span>Success!</span></div>

<!-- Empty state -->
<div class="hero min-h-[200px] bg-base-200 rounded-box">
  <div class="hero-content text-center">
    <div>
      <h1 class="text-2xl font-bold">Nothing here yet</h1>
      <p class="py-4 text-base-content/70">Get started by creating one.</p>
      <.link navigate={~p"/new"} class="btn btn-primary">Create</.link>
    </div>
  </div>
</div>
```
